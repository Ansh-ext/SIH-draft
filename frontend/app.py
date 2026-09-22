"""
Streamlit frontend for MRPL workbench.

Provides a chat interface, file uploads, document ingestion into RAG,
real-time agent execution tracking via st.status, and direct deliverable downloads.
"""

import os
import sys
import uuid

import streamlit as st

# Add the project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.graph import run_agent
from rag.embeddings import get_embedder
from rag.ingest import ingest_file
from rag.vectorstore import get_collection

st.set_page_config(
    page_title="MRPL Workbench",
    page_icon="🏭",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Pre-warm singletons once to eliminate first-query cold start
@st.cache_resource(show_spinner=False)
def prewarm_pipeline():
    try:
        get_embedder()
        get_collection()
    except Exception as e:
        print(f"[prewarm] initialization notice: {e}")

prewarm_pipeline()

# Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Session state initialization
if "messages" not in st.session_state:
    st.session_state.messages = []
if "active_file" not in st.session_state:
    st.session_state.active_file = None

# Header
st.title("🏭 MRPL Agentic Industrial Workbench")
st.caption("Air-gapped AI assistant for refinery SOP compliance, sandboxed code execution, engineering vision, and spreadsheet analysis.")

# --- Sidebar ---
with st.sidebar:
    st.header("⚙️ Settings & Context")
    department = st.selectbox(
        "Department Context",
        options=["general", "rotating_equipment", "static_equipment", "electrical"],
        index=0,
        help="Filter knowledge base queries to a specific refinery department.",
    )
    
    st.divider()
    
    st.header("📁 Document & File Upload")
    uploaded_file = st.file_uploader(
        "Upload SOPs, drawings, or spreadsheets",
        type=["pdf", "txt", "docx", "md", "xlsx", "xls", "csv", "png", "jpg"],
        help="Text and PDF documents are automatically ingested into the RAG knowledge base.",
    )
    
    if uploaded_file is not None:
        file_path = os.path.join(UPLOADS_DIR, uploaded_file.name)
        with open(file_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        
        # Set as active file
        st.session_state.active_file = file_path
        
        # Ingest if document
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext in (".pdf", ".txt", ".docx", ".md"):
            with st.spinner(f"Indexing {uploaded_file.name} into knowledge base..."):
                n_chunks = ingest_file(file_path, department=department if department != "general" else "general")
            st.success(f"✅ Indexed {uploaded_file.name} ({n_chunks} chunk(s) ready in RAG)")
        elif ext in (".xlsx", ".xls", ".csv"):
            st.success(f"📊 Spreadsheet ready for analysis: `{uploaded_file.name}`")
        elif ext in ('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'):
            st.success(f"👁️ Image ready for OCR/Vision: `{uploaded_file.name}`")

    # Active Attachment Status
    if st.session_state.active_file and os.path.exists(st.session_state.active_file):
        fname = os.path.basename(st.session_state.active_file)
        st.info(f"📎 **Attached File**: `{fname}`")
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("❌ Detach File", use_container_width=True):
                st.session_state.active_file = None
                st.rerun()
        with col_b:
            ext = os.path.splitext(fname)[1].lower()
            if ext in (".pdf", ".txt", ".docx", ".md"):
                if st.button("🔄 Re-index", use_container_width=True):
                    n = ingest_file(st.session_state.active_file, department=department if department != "general" else "general")
                    st.success(f"Re-indexed {n} chunk(s)!")

    # Ingest existing files button
    st.divider()
    if st.button("📥 Index All Files in uploads/", use_container_width=True):
        with st.spinner("Indexing uploads folder..."):
            total_ingested = 0
            for f in os.listdir(UPLOADS_DIR):
                fpath = os.path.join(UPLOADS_DIR, f)
                ext = os.path.splitext(f)[1].lower()
                if os.path.isfile(fpath) and ext in (".pdf", ".txt", ".docx", ".md"):
                    total_ingested += ingest_file(fpath, department="general")
        st.success(f"Indexed {total_ingested} chunk(s) from uploads folder!")

    if st.button("🗑️ Clear Chat History", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# --- Active Attachment Banner in Main View ---
if st.session_state.active_file and os.path.exists(st.session_state.active_file):
    st.info(f"📎 Active Attachment: **{os.path.basename(st.session_state.active_file)}** — queries will analyze and reference this file.")

# --- Quick-start Prompt Suggestions ---
if not st.session_state.messages:
    st.markdown("### 💡 Quick Starters")
    chip_cols = st.columns(4)
    sample_prompts = [
        ("👋 Greeting", "hi"),
        ("🔍 Valve Inspection SOP", "What is the inspection procedure for a pressure relief valve?"),
        ("💻 Python Calculation", "Write a Python function to calculate valve set-pressure deviation"),
        ("📄 Summarize Document", "Summarize the key requirements from the uploaded document."),
    ]
    for i, (label, prompt_text) in enumerate(sample_prompts):
        with chip_cols[i]:
            if st.button(label, use_container_width=True):
                st.session_state.selected_prompt = prompt_text
                st.rerun()

# Check if a prompt was selected from quick starters
prompt = None
if "selected_prompt" in st.session_state and st.session_state.selected_prompt:
    prompt = st.session_state.selected_prompt
    st.session_state.selected_prompt = None

# Or from chat input
if not prompt:
    prompt = st.chat_input("Ask a question, request code, or analyze an image...")

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "deliverables" in message and message["deliverables"]:
            st.markdown("**Generated Files:**")
            for d in message["deliverables"]:
                if os.path.exists(d):
                    fname = os.path.basename(d)
                    with open(d, "rb") as f_dl:
                        st.download_button(
                            label=f"⬇️ Download `{fname}`",
                            data=f_dl.read(),
                            file_name=fname,
                            key=f"dl_{message.get('id', '')}_{fname}",
                        )
                else:
                    st.markdown(f"- `{os.path.basename(d)}`")
        if "audit" in message and message["audit"]:
            with st.expander("View Audit Trail & Agent Trace"):
                st.json(message["audit"])

# Process new user prompt
if prompt:
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Process via Agent with real-time status updates
    with st.chat_message("assistant"):
        with st.status("Agent is planning and executing...", expanded=True) as status:
            stage_names = {
                "route": "🎯 Routing query...",
                "plan": "📋 Planning subtask DAG...",
                "execute": "⚙️ Running subtask tool...",
                "evaluate": "🔍 Evaluating subtask output...",
                "synthesize": "📝 Synthesizing response...",
                "deliver": "📦 Packaging output deliverables...",
            }

            def step_callback(node_name, node_output):
                desc = stage_names.get(node_name, f"Step: {node_name}")
                if node_name == "route":
                    task_type = node_output.get("task_type", "")
                    model = node_output.get("model_tag", "")
                    desc += f" -> **{task_type}** ({model})"
                elif node_name == "plan":
                    subtasks = node_output.get("subtasks", [])
                    if subtasks:
                        desc += f" -> {len(subtasks)} subtask(s)"
                    else:
                        desc += " -> direct response"
                elif node_name == "execute":
                    res = node_output.get("results", [])
                    if res:
                        last_tool = res[-1].get("tool", "")
                        desc += f" -> completed `{last_tool}`"
                elif node_name == "evaluate":
                    scores = node_output.get("confidence_scores", [])
                    if scores:
                        desc += f" -> confidence: {scores[-1]:.2f}"
                status.write(desc)

            try:
                active_f = st.session_state.get("active_file")
                result = run_agent(
                    query=prompt,
                    department=department if department != "general" else None,
                    attached_file=active_f,
                    step_callback=step_callback,
                )
                status.update(label="Complete!", state="complete", expanded=False)
                
                final_answer = result.get("final_answer", "")
                deliverables = result.get("deliverables", [])
                
                st.markdown(final_answer)
                
                if deliverables:
                    st.markdown("**Generated Files:**")
                    for d in deliverables:
                        if os.path.exists(d):
                            fname = os.path.basename(d)
                            with open(d, "rb") as f_dl:
                                st.download_button(
                                    label=f"⬇️ Download `{fname}`",
                                    data=f_dl.read(),
                                    file_name=fname,
                                    key=f"dl_new_{fname}",
                                )
                        else:
                            st.markdown(f"- `{os.path.basename(d)}`")
                
                audit_info = {
                    "task_type": result.get("task_type"),
                    "model_tag": result.get("model_tag"),
                    "route_stage": result.get("route_stage"),
                    "iterations": result.get("iteration_count"),
                    "confidence_scores": result.get("confidence_scores"),
                    "audit_chain_valid": result.get("audit_valid"),
                }
                
                with st.expander("View Audit Trail & Agent Trace"):
                    if audit_info["audit_chain_valid"]:
                        st.success("✅ Audit chain verified (Tamper-proof)")
                    else:
                        st.error("❌ Audit chain verification failed!")
                    st.json(audit_info)
                
                st.session_state.messages.append({
                    "id": str(uuid.uuid4()),
                    "role": "assistant",
                    "content": final_answer,
                    "deliverables": deliverables,
                    "audit": audit_info
                })
                
            except Exception as e:
                status.update(label="Error occurred", state="error", expanded=True)
                st.error(f"Error: {e}")
