"""
Proves three things in one run:
1. Ingesting the sample SOPs only loads the embedder / opens the vector
   store ONCE, no matter how many chunks/documents are processed.
2. Retrieval reuses those same singletons - no reload, no reopen.
3. The router cascade classifies a handful of queries, reusing the same
   embedder again, and shows which stage decided each one.

Run: python demo.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag import embeddings, vectorstore, ingest, retrieve as retrieve_mod
from models import registry
from router import cascade
from agent.graph import run_agent
from audit.hashchain import AuditLog

SAMPLE_DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "sample_docs")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def main():
    print("=" * 70)
    print("STEP 1 - Ingest sample SOPs")
    print("=" * 70)
    n_chunks = ingest.ingest_directory(SAMPLE_DOCS_DIR, department="rotating_equipment")
    print(f"-> ingested {n_chunks} chunks total\n")

    print("=" * 70)
    print("STEP 2 - Retrieve (hybrid BM25 + embedding)")
    print("=" * 70)
    results = retrieve_mod.retrieve("what has to be in an approval note", top_k=3)
    for r in results:
        print(f"  [{r['score']}] ({r['source']}) {r['text'][:90]}...")
    print()

    print("=" * 70)
    print("STEP 3 - Route a few queries through the cascade")
    print("=" * 70)
    test_queries = [
        "write a python script to calculate valve set-pressure deviation",
        "read the handwriting on this scanned inspection form",
        "draft an approval note for the PRV-1042 inspection",
        "what's the deal with this valve thing",  # deliberately ambiguous
    ]
    for q in test_queries:
        task_type, stage, trace = cascade.route(q)
        print(f"  '{q[:55]}...'")
        print(f"    -> task_type={task_type!r} decided by {stage!r}")
        candidates = registry.get_candidates(task_type)
        if candidates:
            print(f"    -> registry picks: {candidates[0].ollama_tag}")
        print()

    print("=" * 70)
    print("STEP 4 - Prove the singletons only loaded ONCE")
    print("=" * 70)
    e1, e2, e3 = embeddings.get_embedder(), embeddings.get_embedder(), embeddings.get_embedder()
    print(f"  get_embedder() called 3x -> same object each time: {e1 is e2 is e3}")
    print(f"  embedder actually constructed {embeddings._load_count} time(s) this process")

    c1, c2 = vectorstore.get_collection(), vectorstore.get_collection()
    print(f"  get_collection() called 2x -> same object each time: {c1 is c2}")
    print(f"  chroma client actually opened {vectorstore._open_count} time(s) this process")

    print("\n" + "=" * 70)
    print("STEP 5 - Run the LangGraph agent loop (requires Ollama running)")
    print("=" * 70)
    try:
        import requests
        # Check if Ollama is running, just so the demo doesn't hang or crash ugly
        requests.get("http://localhost:11434", timeout=1)
        
        agent_q = "Draft an approval note for PRV-1042 finding a 4% set-pressure deviation."
        print(f"  Query: '{agent_q}'\n")
        
        agent_result = run_agent(agent_q, department="rotating_equipment", max_iterations=2)
        print(f"  -> Task Type: {agent_result['task_type']}")
        print(f"  -> Model Used: {agent_result['model_tag']}")
        print(f"  -> Iterations: {agent_result['iteration_count']}")
        print(f"  -> Generated Deliverables: {agent_result['deliverables']}")
        
    except requests.exceptions.RequestException:
        print("  [SKIPPED] Ollama not responding on localhost:11434.")
        print("  Start Ollama and run `ollama run qwen3:4b` to test the agent loop.")
    except Exception as e:
        print(f"  [AGENT ERROR] {e}")

    print("\n" + "=" * 70)
    print("STEP 6 - Verify the Audit Hash-Chain")
    print("=" * 70)
    audit = AuditLog()
    valid, broken_idx = audit.verify()
    if valid:
        entries = audit.get_entries()
        print(f"  ✅ Chain is intact. {len(entries)} events logged.")
    else:
        print(f"  ❌ Chain broken at index {broken_idx}.")


if __name__ == "__main__":
    main()
