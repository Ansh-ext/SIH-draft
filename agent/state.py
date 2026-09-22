"""
LangGraph state definition for the MRPL agentic loop.

This TypedDict flows through every node in the graph — plan, execute,
evaluate, deliver — carrying the full context of a request from start
to finish.
"""

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict

from langchain_core.messages import BaseMessage


class SubTask(TypedDict):
    """A single subtask decomposed by the planner."""
    description: str
    tool: str           # which tool to invoke: rag_search, code_exec, ocr_vision, spreadsheet_op
    params: Dict[str, Any]
    status: str         # pending | running | done | failed
    result: Optional[str]
    confidence: float


class AgentState(TypedDict):
    """Full state flowing through the LangGraph graph."""
    # ── Input ──
    messages: List[BaseMessage]
    user_query: str
    department: Optional[str]
    attached_file: Optional[str]

    # ── Routing ──
    task_type: str                  # coding | vision | reasoning
    route_stage: str                # which cascade stage decided
    route_trace: Dict[str, Any]
    model_tag: str                  # resolved Ollama tag

    # ── Planning ──
    subtasks: List[SubTask]
    current_subtask_idx: int

    # ── Execution ──
    results: List[Dict[str, Any]]
    confidence_scores: List[float]
    iteration_count: int
    max_iterations: int             # hard cap (default 8)
    synthesized_answer: Optional[str]
    # ── Output ──
    deliverables: List[str]         # file paths of generated docs
    final_answer: str
    audit_entries: List[Dict[str, Any]]

    # ── Short‑term memory ──
    short_term_memory: Dict[str, Any]   # persists across run_agent calls via memory.json
