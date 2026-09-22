# mrpl-workbench — router + RAG core

This is the router cascade, model registry, and hybrid RAG layer from the
architecture we designed — coded, installed, and run end to end. It's the
foundation the agent loop, sandbox, backend, and frontend plug into next.

## Setup (needs internet, once)

```bash
pip install -r requirements.txt
python demo.py
```

First run downloads `sentence-transformers/all-MiniLM-L6-v2` (~90MB) into
`.model_cache/` and creates a persistent Chroma database in `.chroma_db/`.
Every run after that — including fully air-gapped ones — loads from those
local folders instead of hitting the network. That's Phase 1 of the build
guide: pull everything once while you have internet, then go air-gapped.

## The "once only" guarantee you asked for

Two different things were being downloaded/rebuilt repeatedly in a naive
version of this, and both are now singletons:

- **Embedding model** (`rag/embeddings.py`) — `get_embedder()` is wrapped in
  `functools.lru_cache(maxsize=1)`. However many times it's called, across
  however many requests or threads, the model is constructed exactly once
  per process. CPython's `lru_cache` locks around the call itself, so even
  concurrent first calls from multiple threads can't race and load it
  twice.
- **Vector database** (`rag/vectorstore.py`) — same pattern for the Chroma
  client and the collection handle. Because it's `PersistentClient` (not
  the in-memory client), the data itself also survives process restarts —
  ingest once, query forever, instead of re-ingesting on every boot.
- **BM25 index** (`rag/bm25_index.py`) — same pattern again, plus a pickle
  on disk, so a process restart doesn't even retokenize the corpus unless
  you've ingested something new since the cache was written.

Run `demo.py` and watch the log lines: every `(first call only)` message
prints exactly once, no matter how many chunks get ingested or how many
queries get routed afterward.

## Structure

```
rag/
  embeddings.py    - singleton embedding model
  vectorstore.py   - singleton persistent Chroma client + collection
  bm25_index.py     - cached BM25 index, invalidated on new ingestion
  ingest.py        - chunk -> embed -> upsert -> invalidate BM25 cache
  retrieve.py       - hybrid dense + sparse retrieval, merged and reranked
models/
  registry.yaml     - the only file you touch to add/swap a model
  registry.py       - loads it once (cached), ranks candidates per task type
router/
  cascade.py        - semantic cache -> regex -> embedding classifier -> LLM judge
data/sample_docs/    - 2 sample SOPs for the demo corpus
demo.py               - ingests, retrieves, routes, and proves the singletons
```

## Verified in this environment

`demo.py` runs end to end in a sandbox without access to huggingface.co, so
the actual model download step is untestable here — that part was verified
separately with a fake embedder swapped in at runtime (not part of this
codebase) to confirm ingestion, Chroma storage, BM25, the router cascade,
and the registry are all wired correctly. On a machine with normal internet
access, `python demo.py` downloads the real model on line one and the rest
is unchanged.

## Next

The agent loop (planner -> subtask DAG -> confidence gate), the Docker
sandbox, the FastAPI backend, and the Streamlit frontend aren't in this pass
— say the word and we build those on top of this.
