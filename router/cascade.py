"""
Router cascade: semantic cache -> regex filter -> embedding classifier ->
LLM judge fallback. Every stage that needs embeddings calls rag.embeddings,
which is the same shared singleton the RAG layer uses - the router never
loads a second copy of the model.
"""

import re
import os
from functools import lru_cache

import numpy as np

from rag.embeddings import embed

CACHE_SIM_THRESHOLD = 0.92
CLASSIFY_MARGIN_THRESHOLD = 0.08

_REGEX_RULES = [
    ("coding", re.compile(r"\b(code|script|function|debug|python|bug|error trace)\b", re.I)),
    ("vision", re.compile(r"\b(image|scanned|drawing|photo|diagram|handwritten)\b", re.I)),
    ("conversational", re.compile(r"^\s*(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day)|help|who\s+are\s+you|what\s+can\s+you\s+do|howdy)\b", re.I)),
    ("reasoning", re.compile(r"\b(summarize|draft|explain|note|approval|report)\b", re.I)),
]

# A handful of labeled examples per task type - the classifier compares the
# incoming query's embedding against these centroids. No model call beyond
# the shared embedder, so this stage is nearly free.
_CLASSIFIER_EXAMPLES = {
    "coding": [
        "write a python script to parse this log file",
        "fix the bug in this function",
        "calculate flow rate from this formula",
    ],
    "vision": [
        "what does this scanned inspection report say",
        "read the handwriting on this form",
        "interpret this engineering drawing",
    ],
    "reasoning": [
        "summarize this SOP for me",
        "draft an approval note from these findings",
        "cross-reference this report with our manuals",
    ],
    "conversational": [
        "hello there, how can you help me today",
        "who are you and what are your capabilities",
        "help me understand how to use this workbench",
    ],
}

_query_cache = {}  # exact-ish semantic cache: query text -> (task_type, embedding)


@lru_cache(maxsize=1)
def _classifier_centroids():
    centroids = {}
    for task_type, examples in _CLASSIFIER_EXAMPLES.items():
        vecs = embed(examples)
        centroids[task_type] = np.mean(vecs, axis=0)
    return centroids


def _cosine(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


def _check_semantic_cache(query_vec):
    for cached_type, cached_vec in _query_cache.values():
        if _cosine(query_vec, cached_vec) >= CACHE_SIM_THRESHOLD:
            return cached_type
    return None


def _check_regex(query):
    for task_type, pattern in _REGEX_RULES:
        if pattern.search(query):
            return task_type
    return None


def _check_classifier(query_vec):
    centroids = _classifier_centroids()
    scores = {t: _cosine(query_vec, c) for t, c in centroids.items()}
    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    top_type, top_score = ranked[0]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0
    if top_score - second_score >= CLASSIFY_MARGIN_THRESHOLD:
        return top_type, scores
    return None, scores


def _llm_judge(query, judge_model_call):
    """judge_model_call: fn(prompt: str) -> str. Wire this to whichever
    model models.registry marks task_type='judge' (e.g. via an Ollama call)
    - kept as a parameter so this module has zero direct dependency on
    Ollama and stays easy to unit test."""
    prompt = (
        "Classify this request into exactly one category: coding, vision, "
        f"reasoning, or conversational. Reply with only the category word.\nRequest: {query}"
    )
    reply = judge_model_call(prompt).strip().lower()
    for t in ("coding", "vision", "conversational", "reasoning"):
        if t in reply:
            return t
    return "reasoning"


def route(query, judge_model_call=None):
    """Returns (task_type, deciding_stage, trace_dict) - the trace is what
    gets written into the audit log."""
    trace = {}

    by_regex = _check_regex(query)
    if by_regex:
        trace["stage"] = "regex_filter"
        return by_regex, "regex_filter", trace

    query_vec = embed(query)

    cached = _check_semantic_cache(query_vec)
    if cached:
        trace["stage"] = "semantic_cache"
        return cached, "semantic_cache", trace

    by_classifier, scores = _check_classifier(query_vec)
    trace["classifier_scores"] = {k: round(v, 3) for k, v in scores.items()}
    if by_classifier:
        _query_cache[query] = (by_classifier, query_vec)
        trace["stage"] = "embedding_classifier"
        return by_classifier, "embedding_classifier", trace

    if judge_model_call is None:
        trace["stage"] = "judge_unavailable_defaulted"
        return "reasoning", "judge_unavailable_defaulted", trace

    by_judge = _llm_judge(query, judge_model_call)
    _query_cache[query] = (by_judge, query_vec)
    trace["stage"] = "llm_judge"
    return by_judge, "llm_judge", trace
