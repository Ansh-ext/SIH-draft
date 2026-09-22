"""
Hybrid retrieval: dense (embedding) + sparse (BM25), merged and reranked.
Every model/index this touches is the shared singleton — this file never
loads or builds anything itself.
"""

from .embeddings import embed
from .vectorstore import get_collection
from .bm25_index import get_bm25_index, _tokenize


def retrieve(query, top_k=5, department=None):
    collection = get_collection()
    query_vec = embed(query)

    where = {"department": department} if department else None
    dense = collection.query(
        query_embeddings=[query_vec.tolist()],
        n_results=top_k,
        where=where,
    )
    dense_hits = {}
    if dense["ids"] and dense["ids"][0]:
        for i, cid in enumerate(dense["ids"][0]):
            dense_hits[cid] = {
                "text": dense["documents"][0][i],
                "source": dense["metadatas"][0][i].get("source", "?"),
                "dense_score": 1 - dense["distances"][0][i],
            }

    bm25, ids, texts = get_bm25_index()
    sparse_hits = {}
    if bm25 is not None and texts:
        scores = bm25.get_scores(_tokenize(query))
        ranked = sorted(zip(ids, texts, scores), key=lambda x: x[2], reverse=True)[:top_k]
        max_score = max((s for _, _, s in ranked), default=1) or 1
        for cid, text, score in ranked:
            sparse_hits[cid] = {"text": text, "sparse_score": score / max_score}

    all_ids = set(dense_hits) | set(sparse_hits)
    merged = {}
    for cid in all_ids:
        d, s = dense_hits.get(cid, {}), sparse_hits.get(cid, {})
        dense_score = d.get("dense_score", 0.0)
        sparse_score = s.get("sparse_score", 0.0)
        merged[cid] = {
            "text": d.get("text") or s.get("text"),
            "source": d.get("source", "?"),
            "score": round(0.5 * dense_score + 0.5 * sparse_score, 3),
        }

    ranked = sorted(merged.items(), key=lambda kv: kv[1]["score"], reverse=True)[:top_k]
    return [{"chunk_id": cid, **v} for cid, v in ranked]
