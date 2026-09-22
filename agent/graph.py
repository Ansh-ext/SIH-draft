"""
LangGraph agentic loop for the MRPL workbench.

Graph architecture (from the boundary document):
  plan → execute → evaluate → (retry | next subtask | deliver)

Uses:
  - router/cascade.py  for task_type classification
  - models/registry.py for Ollama model selection
  - agent/tools.py     for LangChain tool binding
  - audit/hashchain.py for tamper-evident logging
  - agent/deliverables.py for output document generation

The graph is compiled once via build_graph() and invoked per request.
"""

import json
from typing import Any, Dict, List, Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama
from langgraph.graph import END, StateGraph

from agent.state import AgentState, SubTask
from agent.tools import get_tools
from agent.deliverables import generate_deliverable
from audit.hashchain import AuditLog
from agent.short_term_memory import load_memory, save_memory

from models.registry import get_candidates
import os
from router.cascade import route

# Shared audit log instance
_audit = AuditLog()

# Default confidence threshold and iteration cap
_CONFIDENCE_THRESHOLD = 0.6
_MAX_ITERATIONS = 8


# ======================================================================
# Helper: get an LLM bound to the right Ollama model
# ======================================================================

def _get_llm(model_tag: str, temperature: float = 0.2) -> ChatOllama:
    """Return a ChatOllama instance bound to the given model tag."""
    return ChatOllama(
        model=model_tag,
        temperature=temperature,
        num_predict=2048,
    )


def _get_llm_with_tools(model_tag: str) -> ChatOllama:
    """Return a ChatOllama instance with tools bound."""
    llm = _get_llm(model_tag)
    tools = get_tools()
    return llm.bind_tools(tools)


# ======================================================================
# Node: ROUTE — classify the request and pick a model
# ======================================================================

def route_node(state: AgentState) -> dict:
    """Use the router cascade to classify, then pick the best model."""
    query = state["user_query"]
    department = state.get("department")
    attached_file = state.get("attached_file")

    # If an attached file is present and query doesn't override, inform routing
    if attached_file and os.path.exists(attached_file):
        ext = os.path.splitext(attached_file)[1].lower()
        if ext in ('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'):
            task_type, stage, trace = "vision", "attached_file_override", {"file": attached_file}
        elif ext in ('.xlsx', '.xls', '.csv'):
            task_type, stage, trace = "coding", "attached_file_override", {"file": attached_file}
        else:
            task_type, stage, trace = route(query)
            if attached_file:
                trace = {**trace, "file": attached_file}
    else:
        task_type, stage, trace = route(query)

    candidates = get_candidates(task_type)
    model_tag = candidates[0].ollama_tag if candidates else "granite4:1b"

    # Audit log the routing decision
    _audit.append({
        "event_type": "route",
        "query": query[:200],
        "task_type": task_type,
        "stage": stage,
        "model_selected": model_tag,
        "trace": trace,
    })

    return {
        "task_type": task_type,
        "route_stage": stage,
        "route_trace": trace,
        "model_tag": model_tag,
    }


# ======================================================================
# Node: PLAN — decompose the request into subtasks
# ======================================================================

_PLANNER_SYSTEM = """You are a task planner for an industrial workbench system.
Given a user query, decompose it into 1-5 subtasks. Each subtask should use
one of these tools: rag_search, document_extract, code_exec, ocr_vision,
spreadsheet_op, memory_read, memory_write, memory_set, memory_delete.

IMPORTANT — attached documents: if the user attached a file (PDF, DOCX, TXT,
MD) and the question is ABOUT that file ("this book", "this pdf", the uploaded
file), use document_extract FIRST with file_path = the attached file path and
query = a short restatement of the question. document_extract reads the file
directly even if it was never indexed. Do NOT use ocr_vision (image-only) for
PDF/DOCX/TXT; do NOT fall back to rag_search until document_extract returns
nothing useful.

IMPORTANT for code_exec subtasks: each one runs in its own fresh, isolated
container with NO memory of any other subtask - variables, functions, and
imports from one code_exec call do NOT exist in another. If a task needs
defining something AND then using it (e.g. "write a function and test it"),
put ALL of that in a SINGLE code_exec subtask with one self-contained script,
never split it across multiple code_exec subtasks.

Respond in JSON format ONLY (no markdown, no extra text):
[
  {"description": "what to do", "tool": "tool_name", "params": {"key": "value"}},
  ...
]

Available tools:
- rag_search: Search SOP knowledge base. Params: {"query": "...", "department": "..."}
- document_extract: Read an attached document (PDF/DOCX/TXT/MD) directly. Params: {"file_path": "...", "query": "...", "top_k": 5}
- code_exec: Run Python code. Params: {"code": "...", "language": "python"}
- ocr_vision: Extract text from image. Params: {"image_path": "..."}
- spreadsheet_op: Work with Excel/CSV. Params: {"file_path": "...", "operation": "read|query|stats|extract"}
- memory_read: Read ALL stored short‑term memory. Params: {}
- memory_write: Overwrite ALL short‑term memory. Params: {"data": "{\"key\": \"value\"}"}
- memory_set: Set a single key in memory. Params: {"key": "...", "value": "..."}
- memory_delete: Remove a single key from memory. Params: {"key": "..."}
"""


def plan_node(state: AgentState) -> dict:
    """Decompose the user query into a subtask DAG."""
    query = state["user_query"]
    attached_file = state.get("attached_file")
    task_type = state.get("task_type", "reasoning")

    # 1. Conversational shortcut — direct response, zero tool execution
    if task_type == "conversational":
        lower_q = query.strip().lower()
        is_simple_greeting = any(lower_q.startswith(g) for g in [
            "hi", "hello", "hey", "greetings", "good morning", "good afternoon",
            "good evening", "help", "who are you", "what can you do", "howdy"
        ])
        if is_simple_greeting:
            greeting_text = (
                "Hello! I am the **MRPL Agentic Workbench Assistant**.\n\n"
                "I am designed to assist engineers and refinery operators at Mangalore Refinery "
                "and Petrochemicals Limited with industrial workflows:\n\n"
                "1. 🔍 **SOP & Document Intelligence (RAG)**: Search operating procedures, standards, "
                "inspection protocols, and uploaded technical documents.\n"
                "2. 💻 **Sandboxed Code Execution**: Run Python calculations, simulations, and engineering "
                "logic in an isolated, secure Docker container.\n"
                "3. 👁️ **Engineering Drawing & OCR Inspection**: Extract text and examine scanned reports, "
                "P&IDs, and equipment diagrams.\n"
                "4. 📊 **Operational Spreadsheet Analysis**: Query, filter, and analyze Excel (.xlsx) and CSV logs.\n\n"
                "Upload a document, ask a technical question, or request a calculation to get started!"
            )
        else:
            reasoning_candidates = get_candidates("reasoning")
            planner_model = reasoning_candidates[0].ollama_tag if reasoning_candidates else "granite4:1b"
            try:
                llm = _get_llm(planner_model, temperature=0.3)
                sys_prompt = "You are the MRPL Industrial Assistant for Mangalore Refinery and Petrochemicals Limited. Answer politely and concisely as an industrial AI assistant."
                resp = llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=query)])
                greeting_text = resp.content.strip()
            except Exception:
                greeting_text = "Hello! I am the MRPL Agentic Assistant. How can I assist you today?"

        _audit.append({
            "event_type": "plan",
            "subtask_count": 0,
            "subtasks": ["conversational_direct_reply"],
        })
        return {
            "subtasks": [],
            "current_subtask_idx": 0,
            "results": [],
            "confidence_scores": [1.0],
            "iteration_count": 0,
            "synthesized_answer": greeting_text,
            "final_answer": greeting_text,
        }

    # 2. Attached file fast-path handling
    if attached_file and os.path.exists(attached_file):
        ext = os.path.splitext(attached_file)[1].lower()
        if ext in ('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'):
            subtasks = [SubTask(
                description=f"Extract text and details from image: {os.path.basename(attached_file)}",
                tool="ocr_vision",
                params={"image_path": attached_file},
                status="pending",
                result=None,
                confidence=0.0,
            )]
            _audit.append({
                "event_type": "plan",
                "subtask_count": 1,
                "subtasks": [subtasks[0]["description"]],
            })
            return {
                "subtasks": subtasks,
                "current_subtask_idx": 0,
                "results": [],
                "confidence_scores": [],
                "iteration_count": 0,
            }
        elif ext in ('.xlsx', '.xls', '.csv'):
            subtasks = [SubTask(
                description=f"Read spreadsheet structure and data: {os.path.basename(attached_file)}",
                tool="spreadsheet_op",
                params={"file_path": attached_file, "operation": "read"},
                status="pending",
                result=None,
                confidence=0.0,
            )]
            _audit.append({
                "event_type": "plan",
                "subtask_count": 1,
                "subtasks": [subtasks[0]["description"]],
            })
            return {
                "subtasks": subtasks,
                "current_subtask_idx": 0,
                "results": [],
                "confidence_scores": [],
                "iteration_count": 0,
            }
        elif ext in ('.pdf', '.txt', '.md', '.docx'):
            subtasks = [SubTask(
                description=(
                    f"Read the attached document {os.path.basename(attached_file)} "
                    f"and find passages relevant to: {query[:200]}"
                ),
                tool="document_extract",
                params={"file_path": attached_file, "query": query},
                status="pending",
                result=None,
                confidence=0.0,
            )]
            _audit.append({
                "event_type": "plan",
                "subtask_count": 1,
                "subtasks": [subtasks[0]["description"]],
            })
            return {
                "subtasks": subtasks,
                "current_subtask_idx": 0,
                "results": [],
                "confidence_scores": [],
                "iteration_count": 0,
            }

    # 3. Standard task planning via reasoning model
    reasoning_candidates = get_candidates("reasoning")
    planner_model = reasoning_candidates[0].ollama_tag if reasoning_candidates else "granite4:1b"

    try:
        llm = _get_llm(planner_model, temperature=0.1)
        planner_input = f"User query: {query}"
        if attached_file:
            planner_input += f" (Attached file: {os.path.basename(attached_file)})"

        response = llm.invoke([
            SystemMessage(content=_PLANNER_SYSTEM),
            HumanMessage(content=planner_input),
        ])

        # Parse the JSON response
        content = response.content.strip()
        if "```json" in content:
            content = content.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in content:
            content = content.split("```", 1)[1].split("```", 1)[0].strip()

        if "[" in content and "]" in content:
            start = content.index("[")
            end = content.rindex("]") + 1
            content = content[start:end]

        try:
            raw_tasks = json.loads(content)
        except Exception:
            import re
            cleaned = re.sub(r'\}\s*\}', '}', content)
            cleaned = re.sub(r',\s*\]', ']', cleaned)
            cleaned = re.sub(r',\s*\}', '}', cleaned)
            raw_tasks = json.loads(cleaned)

        subtasks = []
        for t in raw_tasks:
            subtasks.append(SubTask(
                description=t.get("description", ""),
                tool=t.get("tool", "rag_search"),
                params=t.get("params", {}),
                status="pending",
                result=None,
                confidence=0.0,
            ))
    except Exception as e:
        # os and re are imported globally; no need for local imports

        # Locate any actual image file referenced in the query or workspace
        found_img = None
        for f in os.listdir("."):
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp')):
                if f.lower() in query.lower():
                    found_img = f
                    break

        if not found_img:
            img_match = re.search(r'([a-zA-Z0-9_\-.]+\.(?:png|jpg|jpeg|bmp|tiff))', query, re.IGNORECASE)
            if img_match:
                found_img = img_match.group(1)

        if state.get("task_type") == "vision" or found_img:
            img_path = found_img or "image copy.png"
            subtasks = [SubTask(
                description=f"Extract text from image: {img_path}",
                tool="ocr_vision",
                params={"image_path": img_path},
                status="pending",
                result=None,
                confidence=0.0,
            )]
        else:
            # Fallback: single RAG search subtask
            subtasks = [SubTask(
                description=f"Search knowledge base for: {query}",
                tool="rag_search",
                params={"query": query, "department": state.get("department")},
                status="pending",
                result=None,
                confidence=0.0,
            )]

    _audit.append({
        "event_type": "plan",
        "subtask_count": len(subtasks),
        "subtasks": [s["description"] for s in subtasks],
    })

    return {
        "subtasks": subtasks,
        "current_subtask_idx": 0,
        "results": [],
        "confidence_scores": [],
        "iteration_count": 0,
    }


# ======================================================================
# Node: EXECUTE — run the current subtask's tool
# ======================================================================

def execute_node(state: AgentState) -> dict:
    """Execute the current subtask by invoking the appropriate tool."""
    idx = state.get("current_subtask_idx", 0)
    subtasks = list(state.get("subtasks", []))
    if not subtasks or idx >= len(subtasks):
        return {"subtasks": subtasks, "results": state.get("results", [])}

    subtask = subtasks[idx]

    tool_map = {t.name: t for t in get_tools()}
    tool_name = subtask["tool"]
    params = subtask["params"]

    subtask_copy = dict(subtask)
    subtask_copy["status"] = "running"
    subtasks[idx] = SubTask(**subtask_copy)

    try:
        if tool_name in tool_map:
            tool_fn = tool_map[tool_name]
            result = tool_fn.invoke(params)
        else:
            result = f"Unknown tool: {tool_name}"

        subtask_copy["result"] = str(result)
        subtask_copy["status"] = "done"
    except Exception as e:
        subtask_copy["result"] = f"Error: {e}"
        subtask_copy["status"] = "failed"

    subtasks[idx] = SubTask(**subtask_copy)

    results = list(state.get("results", []))
    results.append({"subtask_idx": idx, "tool": tool_name, "output": subtask_copy["result"]})

    iteration_count = state.get("iteration_count", 0) + 1

    _audit.append({
        "event_type": "execute",
        "subtask_idx": idx,
        "tool": tool_name,
        "status": subtask_copy["status"],
        "iteration": iteration_count,
    })

    return {
        "subtasks": subtasks,
        "results": results,
        "iteration_count": iteration_count,
    }


# ======================================================================
# Node: EVALUATE — confidence gate
# ======================================================================

def evaluate_node(state: AgentState) -> dict:
    """Check result quality. Score confidence for the current subtask."""
    idx = state.get("current_subtask_idx", 0)
    subtasks = list(state.get("subtasks", []))
    if not subtasks or idx >= len(subtasks):
        return {
            "subtasks": subtasks,
            "confidence_scores": state.get("confidence_scores", []),
        }

    subtask = subtasks[idx]
    result_text = subtask.get("result", "") or ""

    # Heuristic confidence scoring:
    confidence = 0.0

    if subtask["status"] == "failed":
        confidence = 0.0
    elif not result_text or result_text.strip() == "(no output)":
        confidence = 0.1
    else:
        # Base confidence from having a result
        confidence = 0.5

        # Boost for longer, more detailed results
        word_count = len(result_text.split())
        if word_count > 50:
            confidence += 0.2
        elif word_count > 20:
            confidence += 0.1

        # Boost for source citations (RAG results)
        if "source:" in result_text.lower():
            confidence += 0.15

        # Boost for successful code execution
        if "exit code: 0" in result_text:
            confidence += 0.15

        # Penalty for errors
        if "error" in result_text.lower() or "traceback" in result_text.lower():
            confidence -= 0.2

        confidence = max(0.0, min(1.0, confidence))

    subtask_copy = dict(subtask)
    subtask_copy["confidence"] = confidence
    subtasks[idx] = SubTask(**subtask_copy)

    confidence_scores = list(state.get("confidence_scores", []))
    confidence_scores.append(confidence)

    _audit.append({
        "event_type": "evaluate",
        "subtask_idx": idx,
        "confidence": round(confidence, 3),
        "threshold": _CONFIDENCE_THRESHOLD,
        "passed": confidence >= _CONFIDENCE_THRESHOLD,
    })

    return {
        "subtasks": subtasks,
        "confidence_scores": confidence_scores,
    }


# ======================================================================
# Conditional edge: after evaluate, decide what to do
# ======================================================================

def should_continue(state: AgentState) -> str:
    """Decide next step after evaluation.

    Returns one of: 'retry', 'next_subtask', 'deliver'
    """
    idx = state.get("current_subtask_idx", 0)
    subtasks = state.get("subtasks", [])
    iteration_count = state.get("iteration_count", 0)
    max_iter = state.get("max_iterations", _MAX_ITERATIONS)

    if not subtasks or idx >= len(subtasks) or iteration_count >= max_iter:
        return "deliver"

    current = subtasks[idx]
    confidence = current.get("confidence", 0.0)

    results_for_this = [r for r in state.get("results", []) if r.get("subtask_idx") == idx]
    times_run = len(results_for_this)

    # Low confidence → retry (at most 1 retry per subtask)
    if confidence < _CONFIDENCE_THRESHOLD and times_run < 2 and iteration_count < max_iter:
        return "retry"

    # Move to next subtask
    if idx + 1 < len(subtasks):
        return "next_subtask"

    # All subtasks done
    return "deliver"


def advance_subtask(state: AgentState) -> dict:
    """Move to the next subtask."""
    return {"current_subtask_idx": state["current_subtask_idx"] + 1}


# ======================================================================
# Node: DELIVER — collect results and generate deliverables
# ======================================================================

def synthesize_node(state: AgentState) -> dict:
    """Take all raw tool outputs and actually draft a coherent response.

    Without this step, the deliverable is just raw tool outputs pasted
    together (e.g. raw OCR text next to unrelated RAG search results) -
    no model ever reads everything together and writes real content.
    This node closes that gap by feeding all subtask results back into
    the reasoning model with an explicit drafting instruction.
    """
    subtasks = state.get("subtasks", [])
    user_query = state.get("user_query", "")

    # Always use a reasoning model for synthesis, never a vision-only model
    reasoning_candidates = get_candidates("reasoning")
    model_tag = reasoning_candidates[0].ollama_tag if reasoning_candidates else "granite4:1b"

    raw_results = "\n\n".join(
        f"[{st['tool']}] {st['description']}:\n{st['result']}"
        for st in subtasks if st.get("result")
    )

    if not raw_results.strip():
        return {"synthesized_answer": "No results gathered from subtasks."}

    synthesis_prompt = f"""You are drafting a response to this request: "{user_query}"

Here is the raw information gathered by various tools:

{raw_results}

Write a single, coherent, well-structured response that directly answers the
request above, using ONLY the information gathered. If the gathered
information is irrelevant to the request, say so explicitly rather than
including it anyway. Do not just repeat the raw tool output verbatim -
synthesize it into real prose."""

    try:
        llm = _get_llm(model_tag, temperature=0.2)
        response = llm.invoke([HumanMessage(content=synthesis_prompt)])
        content = response.content.strip()
        if content:
            return {"synthesized_answer": content}
        return {"synthesized_answer": raw_results}
    except Exception as e:
        return {"synthesized_answer": f"(Synthesis failed: {e})\n\nRaw results:\n{raw_results}"}


def deliver_node(state: AgentState) -> dict:
    """Collect all results and generate the final deliverable."""
    task_type = state.get("task_type", "reasoning")
    subtasks = state.get("subtasks", [])
    user_query = state.get("user_query", "")

    # If conversational direct reply or no subtasks, return immediately without file generation
    if task_type == "conversational" or not subtasks:
        answer = state.get("synthesized_answer") or state.get("final_answer") or "Hello! How can I assist you today?"
        return {
            "deliverables": [],
            "final_answer": answer,
        }

    # Collect all results into a fallback content block
    content_parts = []
    sources = []
    for st in subtasks:
        if st.get("result"):
            content_parts.append(f"## {st['description']}\n\n{st['result']}")
            if "source:" in (st.get("result") or "").lower():
                sources.append(st["description"])

    raw_fallback = "\n\n---\n\n".join(content_parts) if content_parts else "No results generated."

    # Use the synthesized, model-drafted answer if present, otherwise raw fallback
    synthesized = (state.get("synthesized_answer") or "").strip()
    full_content = synthesized if synthesized else raw_fallback
    sources = [st["description"] for st in subtasks if "source:" in (st.get("result") or "").lower()]

    # For coding tasks, the deliverable should be the ACTUAL source code that
    # was run in the sandbox - not the human-readable result report. Pull the
    # real code straight from each code_exec subtask's params instead.
    code_content = None
    if task_type == "coding":
        code_blocks = [
            st["params"].get("code", "")
            for st in subtasks
            if st.get("tool") == "code_exec" and st.get("params", {}).get("code")
        ]
        if code_blocks:
            code_content = "\n\n# " + ("-" * 60) + "\n\n".join(code_blocks) if len(code_blocks) > 1 else code_blocks[0]

    # Generate deliverable file only for actual deliverables
    deliverables = []
    try:
        if task_type == "coding" and code_content:
            from agent.deliverables import generate_code_file
            path = generate_code_file(code_content)
            deliverables.append(path)
        elif task_type in ("reasoning", "vision"):
            has_results = any(bool(st.get("result")) for st in subtasks)
            if has_results:
                path = generate_deliverable(
                    task_type=task_type,
                    content=full_content,
                    title=f"MRPL: {user_query[:80]}",
                    sources=sources if sources else None,
                )
                deliverables.append(path)
    except Exception as e:
        full_content += f"\n\n(Deliverable generation failed: {e})"

    _audit.append({
        "event_type": "deliver",
        "task_type": task_type,
        "deliverable_count": len(deliverables),
        "deliverables": deliverables,
    })

    # Persist any memory updates the agent made during this run
    updated_memory = state.get("short_term_memory", {})
    if updated_memory:
        save_memory(updated_memory)

    return {
        "deliverables": deliverables,
        "final_answer": full_content,
    }


# ======================================================================
# Build the LangGraph
# ======================================================================

def check_plan_route(state: AgentState) -> str:
    """If no subtasks (e.g. conversational direct reply), bypass execution and go directly to deliver."""
    if not state.get("subtasks"):
        return "deliver"
    return "execute"


def build_graph() -> StateGraph:
    """Construct and compile the MRPL agentic loop graph.

    Flow:
      route → plan → (execute → evaluate → (retry | next_subtask | synthesize) | deliver) → deliver → END
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("route", route_node)
    workflow.add_node("plan", plan_node)
    workflow.add_node("execute", execute_node)
    workflow.add_node("evaluate", evaluate_node)
    workflow.add_node("advance", advance_subtask)
    workflow.add_node("synthesize", synthesize_node)
    workflow.add_node("deliver", deliver_node)

    # Entry point
    workflow.set_entry_point("route")

    # Fixed edges
    workflow.add_edge("route", "plan")

    # Conditional edge from plan: bypass execution if 0 subtasks (e.g. conversational)
    workflow.add_conditional_edges(
        "plan",
        check_plan_route,
        {
            "execute": "execute",
            "deliver": "deliver",
        },
    )

    workflow.add_edge("execute", "evaluate")

    # Conditional edges from evaluate
    workflow.add_conditional_edges(
        "evaluate",
        should_continue,
        {
            "retry": "execute",
            "next_subtask": "advance",
            "deliver": "synthesize",
        },
    )

    # After advancing, execute the next subtask
    workflow.add_edge("advance", "execute")

    # Synthesize the actual draft, THEN write the deliverable file
    workflow.add_edge("synthesize", "deliver")

    # Deliver → END
    workflow.add_edge("deliver", END)

    return workflow.compile()


# ======================================================================
# Public API — single entry point for running a query
# ======================================================================

def run_agent(
    query: str,
    department: Optional[str] = None,
    attached_file: Optional[str] = None,
    max_iterations: int = _MAX_ITERATIONS,
    step_callback: Optional[Any] = None,
) -> Dict[str, Any]:
    """Run the full agentic loop on a user query.

    Returns a dict with:
      - final_answer: str
      - deliverables: list of file paths
      - task_type: str
      - model_tag: str
      - audit_valid: bool
    """
    graph = build_graph()

    initial_state: AgentState = {
        "messages": [HumanMessage(content=query)],
        "user_query": query,
        "department": department,
        "attached_file": attached_file,
        "task_type": "",
        "route_stage": "",
        "route_trace": {},
        "model_tag": "",
        "subtasks": [],
        "current_subtask_idx": 0,
        "results": [],
        "confidence_scores": [],
        "iteration_count": 0,
        "max_iterations": max_iterations,
        "synthesized_answer": None,
        "deliverables": [],
        "final_answer": "",
        "audit_entries": [],
        "short_term_memory": load_memory(),   # load persisted memory before each run
    }

    final_state = dict(initial_state)
    for event in graph.stream(initial_state):
        for node_name, node_output in event.items():
            final_state.update(node_output)
            if step_callback:
                try:
                    step_callback(node_name, node_output)
                except Exception:
                    pass

    # Verify the audit chain
    valid, broken_at = _audit.verify()

    return {
        "final_answer": final_state.get("final_answer", ""),
        "deliverables": final_state.get("deliverables", []),
        "task_type": final_state.get("task_type", ""),
        "model_tag": final_state.get("model_tag", ""),
        "route_stage": final_state.get("route_stage", ""),
        "confidence_scores": final_state.get("confidence_scores", []),
        "iteration_count": final_state.get("iteration_count", 0),
        "audit_valid": valid,
    }