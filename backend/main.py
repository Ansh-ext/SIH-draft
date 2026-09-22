"""
FastAPI backend for MRPL Workbench.

Endpoints
─────────
Health
  GET  /health              Liveness probe

Chat
  POST /chat                Run the agentic loop (full response)
  POST /chat/stream         Server-Sent Events stream of agent steps

Files
  POST /upload              Upload file → optional background RAG ingest
  GET  /ingest/status/{id}  Poll a background ingest job's progress
  GET  /ingest              List all ingest jobs
  POST /ingest              Ingest an already-uploaded file into the RAG store
  GET  /files               List uploaded files in uploads/
  GET  /outputs             List generated deliverables in outputs/
  GET  /download/{filename} Download a generated deliverable

RAG
  POST /rag/search          Hybrid dense+sparse retrieval

Memory
  GET  /memory              Read the full short-term memory
  POST /memory              Overwrite short-term memory
  PUT  /memory/{key}        Set a single key
  DELETE /memory/{key}      Delete a single key

Models
  GET  /models              List models from registry.yaml

Audit
  GET  /audit               Return the last N audit log entries
"""

import json
import os
import shutil
import uuid
from typing import Any, Dict, List, Optional

from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

# ── Project imports ──────────────────────────────────────────────────────────
from agent.graph import run_agent
from agent.short_term_memory import load_memory, save_memory
from audit.hashchain import AuditLog
from rag.ingest import ingest_file
from rag.retrieve import retrieve

# ── Path setup ───────────────────────────────────────────────────────────────
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_UPLOAD_DIR = os.path.join(_BASE_DIR, "uploads")
_OUTPUT_DIR = os.path.join(_BASE_DIR, "outputs")
_AUDIT_DIR = os.path.join(_BASE_DIR, ".audit")
os.makedirs(_UPLOAD_DIR, exist_ok=True)
os.makedirs(_OUTPUT_DIR, exist_ok=True)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MRPL Sovereign Workbench API",
    description=(
        "Self-hosted, air-gapped AI workbench for refineries, PSUs, and defence "
        "manufacturing. All inference is local — no data leaves the premises."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared audit log + in-memory ingest jobs
_audit_log = AuditLog()
INGEST_STATUS: Dict[str, Dict[str, Any]] = {}
_INGEST_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}


def _mark_ingest(file_id: str, **fields) -> None:
    INGEST_STATUS.setdefault(file_id, {}).update(fields)


def _run_ingest(file_id: str, file_path: str, department: str) -> None:
    """Background task: ingest a file into the RAG store and record progress."""
    _mark_ingest(file_id, status="running")
    try:
        chunks = ingest_file(file_path, department=department)
        _mark_ingest(file_id, status="done", chunks_ingested=chunks, error=None)
        _audit_log.append({
            "event_type": "ingest",
            "file_id": file_id,
            "file": os.path.basename(file_path),
            "chunks_ingested": chunks,
            "status": "done",
        })
    except Exception as exc:
        _mark_ingest(file_id, status="error", chunks_ingested=0, error=str(exc))
        _audit_log.append({
            "event_type": "ingest",
            "file_id": file_id,
            "file": os.path.basename(file_path),
            "chunks_ingested": 0,
            "status": "error",
            "error": str(exc),
        })


# ═══════════════════════════════════════════════════════════════════════════════
# Pydantic schemas
# ═══════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    query: str
    department: Optional[str] = None
    attached_file: Optional[str] = None   # absolute path of a previously uploaded file
    max_iterations: int = 5


class RAGSearchRequest(BaseModel):
    query: str
    department: Optional[str] = None
    top_k: int = 5


class MemoryWriteRequest(BaseModel):
    data: Dict[str, Any]


class MemorySetRequest(BaseModel):
    value: Any


# ═══════════════════════════════════════════════════════════════════════════════
# Health
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health", tags=["Health"])
def health():
    """Liveness probe — confirms the API process is running."""
    return {"status": "ok", "service": "mrpl-workbench-api"}


# ═══════════════════════════════════════════════════════════════════════════════
# Chat
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/chat", tags=["Chat"])
def chat(request: ChatRequest):
    """
    Run the full agentic loop on a user query and return the complete result.

    The agent will:
    1. Route the query (coding / vision / reasoning / conversational).
    2. Plan 1-5 subtasks.
    3. Execute each subtask using the appropriate local tool.
    4. Synthesise a final answer and write any deliverable files.
    5. Return the answer + paths of generated deliverables.
    """
    try:
        result = run_agent(
            query=request.query,
            department=request.department,
            attached_file=request.attached_file,
            max_iterations=request.max_iterations,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/chat/stream", tags=["Chat"])
def chat_stream(request: ChatRequest):
    """
    Server-Sent Events (SSE) stream of agent steps.

    Each event is a JSON line:
      { "node": "<node_name>", "data": { ... } }

    The final event has node = "final" and contains the full result.
    """
    def _event_generator():
        collected: Dict[str, Any] = {}

        def step_callback(node_name: str, node_output: Dict[str, Any]):
            payload = json.dumps({"node": node_name, "data": node_output})
            yield f"data: {payload}\n\n"
            collected.update(node_output)

        # LangGraph's graph.stream() is synchronous; we wrap it here.
        try:
            from agent.graph import build_graph
            from langchain_core.messages import HumanMessage
            from agent.state import AgentState
            from agent.short_term_memory import load_memory

            graph = build_graph()
            initial_state: AgentState = {
                "messages": [HumanMessage(content=request.query)],
                "user_query": request.query,
                "department": request.department,
                "attached_file": request.attached_file,
                "task_type": "",
                "route_stage": "",
                "route_trace": {},
                "model_tag": "",
                "subtasks": [],
                "current_subtask_idx": 0,
                "results": [],
                "confidence_scores": [],
                "iteration_count": 0,
                "max_iterations": request.max_iterations,
                "synthesized_answer": None,
                "deliverables": [],
                "final_answer": "",
                "audit_entries": [],
                "short_term_memory": load_memory(),
            }

            for event in graph.stream(initial_state):
                for node_name, node_output in event.items():
                    collected.update(node_output)
                    payload = json.dumps({"node": node_name, "data": node_output})
                    yield f"data: {payload}\n\n"

            # Final consolidated result
            final_payload = json.dumps({
                "node": "final",
                "data": {
                    "final_answer": collected.get("final_answer", ""),
                    "deliverables": collected.get("deliverables", []),
                    "task_type": collected.get("task_type", ""),
                    "model_tag": collected.get("model_tag", ""),
                    "iteration_count": collected.get("iteration_count", 0),
                },
            })
            yield f"data: {final_payload}\n\n"

        except Exception as exc:
            err = json.dumps({"node": "error", "data": {"detail": str(exc)}})
            yield f"data: {err}\n\n"

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ═══════════════════════════════════════════════════════════════════════════════
# File Upload & Ingest
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/upload", tags=["Files"])
async def upload(
    file: UploadFile = File(...),
    department: Optional[str] = Form(None),
    auto_ingest: bool = Form(True),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Upload a file to the workspace.

    If `auto_ingest=true` (default), text documents (.pdf, .txt, .md, .docx)
    are indexed into the RAG knowledge base in the background. The upload
    returns immediately; poll `GET /ingest/status/{file_id}` for progress.
    Image files (.png, .jpg, etc.) are saved but not ingested (use /chat for OCR).

    Returns the assigned `file_id` and absolute `path` so you can pass
    `attached_file=path` to /chat.
    """
    file_id = str(uuid.uuid4())
    original_name = file.filename or "unnamed"
    ext = os.path.splitext(original_name)[1].lower()
    save_name = f"{file_id}{ext}"
    save_path = os.path.join(_UPLOAD_DIR, save_name)

    with open(save_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    should_ingest = auto_ingest and ext in _INGEST_EXTENSIONS

    _audit_log.append({
        "event_type": "upload",
        "file_id": file_id,
        "file": original_name,
        "extension": ext,
        "auto_ingest": should_ingest,
    })

    if should_ingest:
        _mark_ingest(
            file_id,
            status="queued",
            file=original_name,
            path=save_path,
            chunks_ingested=0,
        )
        background_tasks.add_task(_run_ingest, file_id, save_path, department or "general")

    return {
        "file_id": file_id,
        "filename": original_name,
        "path": save_path,
        "extension": ext,
        "auto_ingested": should_ingest,
        "ingest_queued": should_ingest,
        "chunks_ingested": 0,
        "ingest_error": None,
        "message": "File uploaded successfully",
    }


@app.get("/ingest/status/{file_id}", tags=["Files"])
def ingest_status(file_id: str):
    """
    Return the status of a background ingest job.

    Statuses: queued → running → done | error. Also returns the number of
    chunks ingested once complete.
    """
    status = INGEST_STATUS.get(file_id)
    if status is None:
        raise HTTPException(status_code=404, detail=f"No ingest job for '{file_id}'")
    return {"file_id": file_id, **status}


@app.get("/ingest", tags=["Files"])
def ingest_statuses():
    """Return the status of all ingest jobs in this process."""
    return {
        "ingests": [
            {"file_id": fid, **status}
            for fid, status in INGEST_STATUS.items()
        ]
    }


@app.post("/ingest", tags=["Files"])
def ingest(
    file_path: str = Form(...),
    department: str = Form("general"),
):
    """
    Manually trigger RAG ingestion for a file that is already on disk.

    `file_path` must be an absolute path inside the project workspace
    (e.g., the `path` returned by /upload).
    """
    # Path traversal guard — must be inside the project root
    if not os.path.abspath(file_path).startswith(os.path.abspath(_BASE_DIR)):
        raise HTTPException(status_code=403, detail="Path outside workspace")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    file_id = str(uuid.uuid4())
    try:
        chunks = ingest_file(file_path, department=department)
        _audit_log.append({
            "event_type": "ingest",
            "file_id": file_id,
            "file": os.path.basename(file_path),
            "chunks_ingested": chunks,
            "status": "done",
        })
        return {
            "file_id": file_id,
            "file": os.path.basename(file_path),
            "chunks_ingested": chunks,
            "status": "ok",
        }
    except Exception as exc:
        _audit_log.append({
            "event_type": "ingest",
            "file_id": file_id,
            "file": os.path.basename(file_path),
            "chunks_ingested": 0,
            "status": "error",
            "error": str(exc),
        })
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# Download Deliverables
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/download/{filename}", tags=["Files"])
def download(filename: str, subdir: Optional[str] = None):
    """
    Download a deliverable produced by the agent (approval note, xlsx, code, etc.).

    Optionally pass `?subdir=reports` (or `code`, `pptx`, etc.) to narrow
    the search. Without it the whole `outputs/` tree is searched.
    """
    if subdir:
        target_dir = os.path.join(_OUTPUT_DIR, subdir)
        file_path = os.path.join(target_dir, filename)
    else:
        file_path = None
        for root, _, files in os.walk(_OUTPUT_DIR):
            if filename in files:
                file_path = os.path.join(root, filename)
                break
        if not file_path:
            raise HTTPException(status_code=404, detail="File not found")

    # Path traversal guard
    if not os.path.abspath(file_path).startswith(os.path.abspath(_OUTPUT_DIR)):
        raise HTTPException(status_code=403, detail="Invalid path")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )


@app.get("/outputs", tags=["Files"])
def list_outputs():
    """List all generated deliverable files in the outputs directory."""
    files = []
    for root, _, fnames in os.walk(_OUTPUT_DIR):
        for fname in fnames:
            full_path = os.path.join(root, fname)
            rel = os.path.relpath(full_path, _OUTPUT_DIR)
            files.append({
                "filename": fname,
                "relative_path": rel,
                "size_bytes": os.path.getsize(full_path),
            })
    return {"outputs": files}


@app.get("/files", tags=["Files"])
def list_files():
    """List all files currently in the uploads directory (uploaded documents)."""
    files = []
    for fname in sorted(os.listdir(_UPLOAD_DIR)):
        full_path = os.path.join(_UPLOAD_DIR, fname)
        if not os.path.isfile(full_path):
            continue
        # fname is "<file_id><ext>" when uploaded via /upload → recover the id
        file_id, _, ext = fname.rpartition(".")
        files.append({
            "file_id": file_id or None,
            "path": full_path,
            "name": fname,
            "size_bytes": os.path.getsize(full_path),
            "updated_at": os.path.getmtime(full_path),
            "ingest_status": INGEST_STATUS.get(file_id, {}).get("status") if file_id else None,
        })
    return {"files": files}


# ═══════════════════════════════════════════════════════════════════════════════
# RAG
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/rag/search", tags=["RAG"])
def rag_search(request: RAGSearchRequest):
    """
    Run a hybrid dense+sparse search against the local RAG knowledge base.

    Returns the top-k most relevant chunks with source citations and scores.
    """
    try:
        results = retrieve(
            query=request.query,
            top_k=request.top_k,
            department=request.department,
        )
        return {"query": request.query, "results": results}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# Short-Term Memory
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/memory", tags=["Memory"])
def memory_get():
    """Return the entire short-term memory as a JSON object."""
    return load_memory()


@app.post("/memory", tags=["Memory"])
def memory_post(request: MemoryWriteRequest):
    """
    Overwrite the entire short-term memory.

    Provide a JSON object. This replaces all existing keys.
    """
    save_memory(request.data)
    return load_memory()


@app.put("/memory/{key}", tags=["Memory"])
def memory_put(key: str, request: MemorySetRequest):
    """
    Set a single key in the short-term memory without touching other keys.
    """
    mem = load_memory()
    mem[key] = request.value
    save_memory(mem)
    return mem


@app.delete("/memory/{key}", tags=["Memory"])
def memory_delete(key: str):
    """
    Delete a single key from the short-term memory.
    Returns a 404 if the key does not exist.
    """
    mem = load_memory()
    if key not in mem:
        raise HTTPException(status_code=404, detail=f"Key '{key}' not found in memory")
    mem.pop(key)
    save_memory(mem)
    return mem


@app.delete("/memory", tags=["Memory"])
def memory_clear():
    """Clear all short-term memory."""
    save_memory({})
    return {"status": "cleared"}


# ═══════════════════════════════════════════════════════════════════════════════
# Model Registry
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/models", tags=["Models"])
def list_models(task_type: Optional[str] = None):
    """
    List models registered in `models/registry.yaml`.

    Optionally filter by `?task_type=coding` (or vision, reasoning, conversational).
    """
    try:
        from models.registry import get_candidates, _load_registry

        if task_type:
            candidates = get_candidates(task_type)
            models = [
                {
                    "model_id": m.model_id,
                    "ollama_tag": m.ollama_tag,
                    "task_types": m.task_types,
                    "vram_mb": m.vram_mb,
                    "quantization": m.quantization,
                }
                for m in candidates
            ]
        else:
            registry = _load_registry()
            models = [
                {
                    "model_id": m.model_id,
                    "ollama_tag": m.ollama_tag,
                    "task_types": m.task_types,
                    "vram_mb": m.vram_mb,
                    "quantization": m.quantization,
                }
                for m in registry
            ]
        return {"models": models}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# Audit Log
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/audit", tags=["Audit"])
def audit_log(limit: int = 50):
    """
    Return the last `limit` entries from the tamper-evident audit log.

    Each entry is a JSON object produced by the agent at routing, planning,
    execution, evaluation, and delivery stages.
    """
    try:
        from audit.hashchain import AuditLog
        al = AuditLog()
        entries = al.read_all()
        return {
            "total": len(entries),
            "entries": entries[-limit:],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/audit/verify", tags=["Audit"])
def audit_verify():
    """
    Verify the integrity of the audit hash chain.

    Returns `valid=true` if no entries have been tampered with, or
    `valid=false` with the index of the first broken link.
    """
    try:
        from audit.hashchain import AuditLog
        al = AuditLog()
        valid, broken_at = al.verify()
        return {"valid": valid, "broken_at": broken_at}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# Web frontend (SPA)
#
# Serves the built React app so the entire workbench runs on a single port
# (e.g. http://<this-machine-ip>:8000) and is reachable from other laptops on
# the same Wi‑Fi. Build the frontend with VITE_API_BASE_URL="" so it talks to
# the same origin. Registered LAST so all API routes above take precedence.
# Optionally override the dist location with the WEB_DIST env var.
# ═══════════════════════════════════════════════════════════════════════════════

_WEB_DIR = os.environ.get(
    "WEB_DIST",
    os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web")),
)
_INDEX_HTML = os.path.join(_WEB_DIR, "index.html")

if os.path.isfile(_INDEX_HTML):
    _assets_dir = os.path.join(_WEB_DIR, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="web-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def web_spa(full_path: str):
        """SPA fallback: any unmatched GET path serves index.html so the
        React Router (BrowserRouter) deep links work when served from FastAPI."""
        return FileResponse(_INDEX_HTML)
