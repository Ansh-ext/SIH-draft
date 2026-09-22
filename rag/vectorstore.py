"""
Singleton, persistent ChromaDB client + collection.

Same lru_cache(maxsize=1) pattern as embeddings.py: the client and the
collection handle are each created exactly once per process, no matter how
many requests call get_collection(). Because it's chromadb.PersistentClient
(not the in-memory client), the actual vector data also survives process
restarts — ingest once, query forever, instead of re-ingesting every boot.
"""

import os
from functools import lru_cache

_PERSIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".chroma_db")
_COLLECTION_NAME = "mrpl_sops"

_open_count = 0  # test/debug hook


@lru_cache(maxsize=1)
def get_client():
    global _open_count
    import chromadb
    os.makedirs(_PERSIST_DIR, exist_ok=True)
    print(f"[vectorstore] opening persistent Chroma client at {_PERSIST_DIR} (first call only)")
    _open_count += 1
    return chromadb.PersistentClient(path=_PERSIST_DIR)


@lru_cache(maxsize=1)
def get_collection():
    client = get_client()
    print(f"[vectorstore] get_or_create_collection('{_COLLECTION_NAME}') (first call only)")
    return client.get_or_create_collection(
        name=_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
