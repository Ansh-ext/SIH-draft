"""
Chunk -> embed (shared singleton model) -> upsert into Chroma (shared
singleton collection) -> invalidate the BM25 cache so it rebuilds once,
lazily, on the next retrieve() call.
"""

import hashlib
import os

from .embeddings import embed
from .embeddings import _safe_text
from .vectorstore import get_collection
from .bm25_index import invalidate_bm25_cache


def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()
    if not words:
        return []
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        if end >= len(words):
            break
        start = end - overlap
    return chunks


def ingest_document(text, source_name, department="general"):
    collection = get_collection()
    chunks = chunk_text(text)
    if not chunks:
        return 0

    # Strip lone surrogates etc. so the tokenizer AND Chroma can serialize them.
    chunks = [_safe_text(c) for c in chunks]

    vectors = embed(chunks)
    ids = [hashlib.sha256(f"{source_name}:{i}".encode()).hexdigest()[:16] for i in range(len(chunks))]
    metadatas = [{"source": source_name, "chunk_index": i, "department": department} for i in range(len(chunks))]

    collection.upsert(
        ids=ids,
        embeddings=[v.tolist() for v in vectors],
        documents=chunks,
        metadatas=metadatas,
    )
    invalidate_bm25_cache()
    return len(chunks)


def extract_text_from_file(file_path: str) -> str:
    """Extract plain text from various document formats (.txt, .md, .pdf, .docx)."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext in (".txt", ".md"):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    elif ext == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            pages_text = []
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    pages_text.append(txt)
            return "\n\n".join(pages_text)
        except Exception as e:
            print(f"[ingest] error reading PDF {file_path}: {e}")
            return ""

    elif ext == ".docx":
        try:
            import docx
            doc = docx.Document(file_path)
            paras = [p.text for p in doc.paragraphs if p.text]
            return "\n\n".join(paras)
        except Exception as e:
            print(f"[ingest] error reading DOCX {file_path}: {e}")
            return ""

    return ""


def ingest_file(file_path: str, department: str = "general") -> int:
    """Extract text and ingest a single file into the knowledge base."""
    text = extract_text_from_file(file_path)
    if not text or not text.strip():
        return 0
    fname = os.path.basename(file_path)
    return ingest_document(text, source_name=fname, department=department)


def ingest_directory(dir_path, department="general"):
    total = 0
    for fname in sorted(os.listdir(dir_path)):
        ext = os.path.splitext(fname)[1].lower()
        if ext not in (".txt", ".md", ".pdf", ".docx"):
            continue
        fpath = os.path.join(dir_path, fname)
        n = ingest_file(fpath, department=department)
        print(f"[ingest] {fname}: {n} chunks")
        total += n
    return total
