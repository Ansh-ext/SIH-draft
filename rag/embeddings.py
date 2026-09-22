"""
Thread-safe singleton wrapper around the sentence-transformer embedding model.

Two separate "once" guarantees, handled two different ways:

1. Downloaded once, ever (across restarts) — by pointing HF_HOME /
   SENTENCE_TRANSFORMERS_HOME at a project-local, persistent folder instead
   of the default (which may not survive a container rebuild). The weights
   land on disk the first time this runs with internet available; every run
   after that — including fully air-gapped ones — loads from that folder.

2. Loaded into memory once per process (every thread/request reuses it) —
   via functools.lru_cache(maxsize=1) on a zero-argument function. CPython's
   lru_cache wraps the whole call in a lock, so concurrent first calls from
   multiple threads don't race and load the model twice; they serialize,
   and everyone after the first call just gets the cached object back.

Nothing else in this codebase should import SentenceTransformer directly —
always go through get_embedder() / embed() so there's exactly one instance.
"""

import os
from functools import lru_cache

# Must be set before sentence_transformers/huggingface_hub is imported.
_CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".model_cache")
os.environ.setdefault("HF_HOME", _CACHE_DIR)
os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", _CACHE_DIR)
# Default to offline mode if cache exists to eliminate 2+ minute unauthenticated network timeouts
_has_cache = os.path.exists(_CACHE_DIR) and bool(os.listdir(_CACHE_DIR))
os.environ.setdefault("HF_HUB_OFFLINE", "1" if _has_cache else "0")

_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

_load_count = 0  # test/debug hook — see tests/test_singletons.py


@lru_cache(maxsize=1)
def get_embedder():
    """Return the single shared SentenceTransformer instance for this process."""
    global _load_count
    from sentence_transformers import SentenceTransformer
    print(f"[embeddings] loading {_MODEL_NAME} from {_CACHE_DIR} (first call only)")
    _load_count += 1
    return SentenceTransformer(_MODEL_NAME, local_files_only=_has_cache)


def _safe_text(text: str) -> str:
    """Strip characters the tokenizer can't accept (e.g. lone surrogates
    that slip through some PDF text extractors)."""
    return bytes(text, "utf-8", errors="ignore").decode("utf-8")


def embed(texts):
    """Embed a single string or a list of strings using the shared model."""
    model = get_embedder()
    single = isinstance(texts, str)
    items = [_safe_text(t) for t in ([texts] if single else list(texts))]
    vectors = model.encode(items, normalize_embeddings=True)
    return vectors[0] if single else vectors
