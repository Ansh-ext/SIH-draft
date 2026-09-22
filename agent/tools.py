"""
LangChain tools for the MRPL agentic loop.

Four tools behind the @tool decorator, each following the
run_tool(name, params) contract from the boundary document:

  1. rag_search        — hybrid dense+sparse retrieval with source citations
  2. document_extract  — read an attached PDF/DOCX/TXT/MD directly (BM25 ranking)
  3. code_exec         — Docker sandbox execution (--network none)
  4. ocr_vision        — Tesseract first pass, Ollama VL model escalation
  5. spreadsheet_op    — pandas/openpyxl operations on uploaded files

All tools are importable as a list via `get_tools()` for binding
to the LangGraph agent executor.
"""

import json
import os
from typing import Optional

from langchain_core.tools import tool

from .short_term_memory import load_memory, save_memory


# ------------------------------------------------------------------
# 5. Short‑term Memory
# ------------------------------------------------------------------

@tool
def memory_read() -> str:
    """Read the current short‑term memory.

    Returns the entire memory as a JSON string so the agent can reference
    facts that were stored in earlier run_agent calls (e.g., deadlines,
    user preferences, previous results).
    """
    return json.dumps(load_memory(), indent=2, ensure_ascii=False)


@tool
def memory_write(data: str) -> str:
    """Overwrite the entire short‑term memory with new key/value pairs.

    Pass a JSON string representing a dict, e.g.:
        '{"deadline": "2026-10-15", "project": "MRPL-Refinery-Q3"}'

    Returns the updated memory as a JSON string.
    """
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError as exc:
        return f"Error: invalid JSON — {exc}"
    if not isinstance(parsed, dict):
        return "Error: data must be a JSON object (dict), not a list or primitive."
    save_memory(parsed)
    return json.dumps(load_memory(), indent=2, ensure_ascii=False)


@tool
def memory_set(key: str, value: str) -> str:
    """Set a single key in the short‑term memory without erasing the rest.

    Args:
        key:   The memory key to set (e.g., "deadline").
        value: The value to store (will be stored as a string).

    Returns the updated memory as a JSON string.
    """
    mem = load_memory()
    mem[key] = value
    save_memory(mem)
    return json.dumps(mem, indent=2, ensure_ascii=False)


@tool
def memory_delete(key: str) -> str:
    """Delete a single key from the short‑term memory.

    Args:
        key: The memory key to remove (e.g., "deadline").

    Returns the updated memory as a JSON string.
    """
    mem = load_memory()
    mem.pop(key, None)
    save_memory(mem)
    return json.dumps(mem, indent=2, ensure_ascii=False)


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------

def get_tools():
    """Return all tools as a list for binding to the LangGraph agent."""
    return [
        rag_search,
        document_extract,
        code_exec,
        ocr_vision,
        spreadsheet_op,
        memory_read,
        memory_write,
        memory_set,
        memory_delete,
    ]


@tool
def rag_search(query: str, department: Optional[str] = None, top_k: int = 5) -> str:
    """Search the MRPL SOP knowledge base using hybrid dense + sparse retrieval.

    Returns the top-k most relevant chunks with source citations.
    Use this for any question about SOPs, procedures, standards, or inspection protocols.
    """
    from rag.retrieve import retrieve

    results = retrieve(query, top_k=top_k, department=department)
    if not results:
        return "No relevant documents found for this query."

    formatted = []
    for i, r in enumerate(results, 1):
        formatted.append(
            f"[{i}] (source: {r['source']}, score: {r['score']})\n{r['text']}"
        )
    return "\n\n".join(formatted)


@tool
def document_extract(file_path: str, query: Optional[str] = None, top_k: int = 5) -> str:
    """Read an attached document (PDF, DOCX, TXT, MD) directly and return the
    passages most relevant to a query. Use this whenever the user attached a
    document (attached_file) and asks about \"this book\", \"this pdf\", the
    uploaded file, etc. — it works even if the file was never indexed into the
    RAG knowledge base. Do NOT use ocr_vision for non-image attachments.

    Args:
        file_path: absolute path of the attached document
        query: what to look for inside the document (optional)
        top_k: how many passages to return (default 5)
    """
    if not os.path.exists(file_path):
        return f"Error: file not found at {file_path}"

    from rag.ingest import chunk_text, extract_text_from_file

    text = extract_text_from_file(file_path)
    if not text or not text.strip():
        return (
            f"No readable text could be extracted from {os.path.basename(file_path)}. "
            "The file may be a scanned PDF (no text layer)."
        )

    source = os.path.basename(file_path)
    chunks = chunk_text(text)

    if not query:
        return "\n\n".join(
            f"[{i + 1}] (source: {source})\n{c}" for i, c in enumerate(chunks[:top_k])
        )

    from rank_bm25 import BM25Okapi

    tokens = [c.lower().split() for c in chunks]
    scores = BM25Okapi(tokens).get_scores(query.lower().split())
    ordered = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    hits = [
        f"[{i + 1}] (source: {source}, score: {scores[idx]:.3f})\n{chunks[idx]}"
        for i, idx in enumerate(ordered)
        if scores[idx] > 0
    ]
    if not hits:
        return f"No passages in {source} matched the query '{query}'. Try a broader query."
    return "\n\n".join(hits)


# ------------------------------------------------------------------
# 2. Code Execution
# ------------------------------------------------------------------

@tool
def code_exec(code: str, language: str = "python") -> str:
    """Execute code in a sandboxed environment (Docker with --network none).

    Use this to run Python scripts, calculations, data processing, or any
    code the user or agent generates. Returns stdout and stderr.
    """
    from sandbox.executor import run_sandboxed

    result = run_sandboxed(code, language=language, timeout=30)

    output_parts = []
    if result.stdout:
        output_parts.append(f"STDOUT:\n{result.stdout}")
    if result.stderr:
        output_parts.append(f"STDERR:\n{result.stderr}")
    if result.timed_out:
        output_parts.append("⚠ Execution timed out.")

    output_parts.append(f"(exit code: {result.exit_code}, engine: {result.engine})")
    return "\n".join(output_parts) or "(no output)"


# ------------------------------------------------------------------
# 3. OCR / Vision
# ------------------------------------------------------------------

@tool
def ocr_vision(image_path: str) -> str:
    """Extract text from an image file (scanned document, photo, diagram).

    Uses Tesseract OCR for a fast first pass. If confidence is low or the
    content appears handwritten/diagrammatic, escalates to the qwen3-vl
    vision model via Ollama.
    """
    if not os.path.exists(image_path):
        # Fallback: check if a matching image file exists in workspace
        basename = os.path.basename(image_path).strip()
        matched = False
        for f in os.listdir("."):
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp')):
                if basename.lower() in f.lower() or f.lower() in basename.lower():
                    image_path = f
                    matched = True
                    break
        if not matched:
            return f"Error: file not found at {image_path}"

    # --- Stage 1: Tesseract ---
    try:
        import pytesseract
        from PIL import Image

        tesseract_default = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(tesseract_default):
            pytesseract.pytesseract.tesseract_cmd = tesseract_default

        img = Image.open(image_path)
        ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

        # Calculate average confidence (skip empty/low entries)
        confidences = [
            int(c) for c in ocr_data.get("conf", [])
            if str(c).lstrip("-").isdigit() and int(c) > 0
        ]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0
        text = pytesseract.image_to_string(img).strip()

        if avg_conf >= 70 and len(text) > 20:
            return f"[OCR via Tesseract, confidence: {avg_conf:.0f}%]\n{text}"

    except ImportError:
        text = ""
        avg_conf = 0
    except Exception as e:
        text = ""
        avg_conf = 0

    # --- Stage 2: Escalate to vision model ---
    try:
        from langchain_ollama import ChatOllama
        from langchain_core.messages import HumanMessage
        import base64
        from models.registry import get_candidates

        vision_candidates = get_candidates("vision")
        vision_model = vision_candidates[0].ollama_tag if vision_candidates else "moondream:latest"

        with open(image_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")

        llm = ChatOllama(model=vision_model, temperature=0)
        message = HumanMessage(
            content=[
                {"type": "text", "text": "Extract all text from this image. If it contains diagrams or drawings, describe them in detail."},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
            ]
        )
        response = llm.invoke([message])
        return f"[Vision model: {vision_model}]\n{response.content}"

    except Exception as vision_error:
        # Return whatever Tesseract got, with a note about the failed escalation
        if text:
            return f"[OCR via Tesseract, low confidence: {avg_conf:.0f}%]\n{text}\n\n(Vision model escalation failed: {vision_error})"
        return f"Error: OCR and vision model both failed. Vision model error: {vision_error}"


# ------------------------------------------------------------------
# 4. Spreadsheet Operations
# ------------------------------------------------------------------

@tool
def spreadsheet_op(file_path: str, operation: str, params: Optional[str] = None) -> str:
    """Perform operations on Excel/CSV spreadsheet files.

    Supported operations:
    - 'read': Read and summarize the spreadsheet contents
    - 'query': Filter/search data (pass SQL-like filter in params)
    - 'stats': Get statistical summary of numeric columns
    - 'extract': Extract specific columns (pass column names in params as JSON list)

    Args:
        file_path: Path to the Excel (.xlsx) or CSV file
        operation: One of 'read', 'query', 'stats', 'extract'
        params: Operation-specific parameters as a JSON string
    """
    import pandas as pd

    if not os.path.exists(file_path):
        return f"Error: file not found at {file_path}"

    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        return f"Error reading file: {e}"

    if operation == "read":
        summary = f"Shape: {df.shape[0]} rows × {df.shape[1]} columns\n"
        summary += f"Columns: {', '.join(str(c) for c in df.columns.tolist())}\n\n"
        summary += f"First 10 rows:\n{df.head(10).to_string()}"
        return summary

    elif operation == "stats":
        return f"Statistical summary:\n{df.describe().to_string()}"

    elif operation == "query":
        if not params:
            return "Error: 'query' operation requires a filter expression in params"
        try:
            filtered = df.query(params)
            return f"Query result ({len(filtered)} rows):\n{filtered.to_string()}"
        except Exception as e:
            return f"Query error: {e}"

    elif operation == "extract":
        if not params:
            return "Error: 'extract' operation requires column names as JSON list in params"
        try:
            cols = json.loads(params)
            return f"Extracted columns:\n{df[cols].to_string()}"
        except Exception as e:
            return f"Extract error: {e}"


    else:
        return f"Unknown operation: {operation}. Use 'read', 'query', 'stats', or 'extract'."