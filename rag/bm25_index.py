"""
Singleton BM25 index over whatever's currently in the vector store.

Building a BM25 index means tokenizing every chunk you've ingested — cheap
for a demo corpus, not something you want to redo on every retrieval call
once the corpus is real. This is cached in memory (lru_cache) AND on disk
(pickle) so a process restart doesn't rebuild it either, unless you've
actually ingested something new since the cache was written.
"""

import os
import pickle
from functools import lru_cache

_INDEX_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".chroma_db", "bm25_index.pkl"
)


def _tokenize(text):
    return text.lower().split()


@lru_cache(maxsize=1)
def get_bm25_index():
    """Returns (BM25Okapi_or_None, ids, texts)."""
    from rank_bm25 import BM25Okapi

    if os.path.exists(_INDEX_PATH):
        print("[bm25] loading cached index from disk (first call only)")
        with open(_INDEX_PATH, "rb") as f:
            return pickle.load(f)

    from .vectorstore import get_collection

    print("[bm25] no cache found — building from the vector store (first call only)")
    collection = get_collection()
    everything = collection.get(include=["documents"])
    ids = everything["ids"]
    texts = everything["documents"]
    bm25 = BM25Okapi([_tokenize(t) for t in texts]) if texts else None

    result = (bm25, ids, texts)
    os.makedirs(os.path.dirname(_INDEX_PATH), exist_ok=True)
    with open(_INDEX_PATH, "wb") as f:
        pickle.dump(result, f)
    return result


def invalidate_bm25_cache():
    """Call after ingesting new documents so the next retrieve() call rebuilds
    the index once, lazily — instead of it silently going stale."""
    get_bm25_index.cache_clear()
    if os.path.exists(_INDEX_PATH):
        os.remove(_INDEX_PATH)
