import { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Send,
  FolderPlus,
  FileUp,
  Wrench,
  FileText,
  Code2,
  ChevronDown,
  ChevronRight,
  X,
  Image as ImageIcon,
  Bot,
  User,
  Sparkles,
  Loader,
  Download,
  Route as RouteIcon,
  ListTree,
  Gauge,
  PackageCheck
} from 'lucide-react';
import { apiService } from '../../services/api';

const STEP_META = {
  route: { icon: RouteIcon, label: 'Routing' },
  plan: { icon: ListTree, label: 'Planning' },
  execute: { icon: Wrench, label: 'Executing' },
  evaluate: { icon: Gauge, label: 'Evaluating' },
  synthesize: { icon: Sparkles, label: 'Synthesizing' },
  deliver: { icon: PackageCheck, label: 'Delivering' }
};

export default function CodexChatbot({ activeDoc }) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your Sovereign Codex Assistant. Upload PDFs, images, or datasets and tell me what to extract, analyze, or build.',
      timestamp: 'Just now'
    }
  ]);
  const [activeTool, setActiveTool] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [, forceTick] = useState(0); // drives the live "Thinking… Ns" counter
  const fileInputRef = useRef(null);
  const thinkingIdRef = useRef(null);

  useEffect(() => {
    const hasActiveThinking = messages.some(
      (m) => m.type === 'thinking' && m.status === 'streaming'
    );
    if (!hasActiveThinking) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [messages]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      name: file.name,
      raw: file,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToolClick = (toolName) => {
    setActiveTool(toolName);
    setInput((prev) => (prev ? `${prev} [${toolName}] ` : `[${toolName}] `));
  };

  const formatTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const pushAiMessage = (partial) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), sender: 'ai', timestamp: formatTimestamp(), ...partial }
    ]);
  };

  const ensureThinkingBlock = () => {
    if (thinkingIdRef.current) return thinkingIdRef.current;
    const id = `thinking-${Date.now()}`;
    thinkingIdRef.current = id;
    setMessages((prev) => [
      ...prev,
      {
        id,
        sender: 'ai',
        type: 'thinking',
        status: 'streaming',
        collapsed: false,
        startedAt: Date.now(),
        endedAt: null,
        steps: []
      }
    ]);
    return id;
  };

  const appendStep = (nodeName, detail) => {
    const id = ensureThinkingBlock();
    const meta = STEP_META[nodeName] || { icon: Sparkles, label: nodeName };
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
            ...m,
            steps: [
              ...m.steps,
              { key: `${nodeName}-${m.steps.length}`, nodeName, label: meta.label, detail }
            ]
          }
          : m
      )
    );
  };

  const finishThinking = ({ collapse = true, markError = false } = {}) => {
    const id = thinkingIdRef.current;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
            ...m,
            status: markError ? 'error' : 'done',
            endedAt: Date.now(),
            collapsed: collapse
          }
          : m
      )
    );
    thinkingIdRef.current = null;
  };

  const toggleThinking = (id) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, collapsed: !m.collapsed } : m))
    );
  };

  const buildStepDetail = (nodeName, data) => {
    switch (nodeName) {
      case 'route':
        return `classified as "${data.task_type || 'unknown'}"${data.model_tag ? ` → ${data.model_tag}` : ''}`;
      case 'plan':
        return Array.isArray(data.subtasks) ? `${data.subtasks.length} subtask(s) queued` : 'direct response';
      case 'execute':
        return (data.results || []).length
          ? `completed tool "${data.results[data.results.length - 1].tool}"`
          : 'running tools…';
      case 'evaluate':
        return (data.confidence_scores || []).length
          ? `confidence ${data.confidence_scores[data.confidence_scores.length - 1].toFixed(2)}`
          : 'scoring…';
      case 'synthesize':
        return 'drafting final response…';
      case 'deliver':
        return (data.deliverables || []).length
          ? `${data.deliverables.length} file(s) generated`
          : 'no files generated';
      default:
        return 'processed';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isSending) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: input,
      attachments: [...attachments],
      timestamp: formatTimestamp()
    };
    let query = input.trim() || 'Analyze the attached file.';
    if (activeTool) query = `${query}\n[Mode: ${activeTool}]`;

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setActiveTool(null);
    setIsSending(true);
    thinkingIdRef.current = null;

    try {
      const attachedPaths = [];
      if (activeDoc?.path) attachedPaths.push(activeDoc.path);

      for (const att of userMsg.attachments) {
        if (!att.raw) continue;
        try {
          const uploaded = await apiService.uploadDocument(att.raw, att.type === 'image' ? 'vision' : 'general');
          if (uploaded.path) attachedPaths.push(uploaded.path);
        } catch (uploadError) {
          console.error('Attachment upload failed:', uploadError);
          pushAiMessage({ mode: 'error', text: `Could not upload "${att.name}": ${uploadError.message}` });
        }
      }

      const options = {
        attached_file: attachedPaths[0] || null,
        department: activeDoc?.department || null,
        max_iterations: 5
      };

      apiService.streamAgentQuery(query, options, (nodeName, data) => {
        if (nodeName === 'error') {
          finishThinking({ collapse: false, markError: true });
          pushAiMessage({ mode: 'error', text: data.detail || 'Agent pipeline error.' });
          return;
        }
        if (nodeName === 'final') {
          finishThinking({ collapse: true });
          pushAiMessage({
            text: data.final_answer || 'Done.',
            deliverables: (data.deliverables || []).map((p) => ({
              name: typeof p === 'string' ? p.split(/[\\/]/).pop() : (p.filename || p.name || 'file'),
              path: typeof p === 'string' ? p : (p.relative_path || p.path || null)
            }))
          });
          return;
        }
        appendStep(nodeName, buildStepDetail(nodeName, data));
      }, (error) => {
        finishThinking({ collapse: false, markError: true });
        pushAiMessage({ mode: 'error', text: error.message || 'Connection to backend failed.' });
      }).finally(() => setIsSending(false));
    } catch (error) {
      finishThinking({ collapse: false, markError: true });
      pushAiMessage({ mode: 'error', text: error.message || 'Connection to backend failed.' });
      setIsSending(false);
    }
  };

  const renderThinkingBlock = (msg) => {
    const isStreaming = msg.status === 'streaming';
    const isError = msg.status === 'error';
    const elapsedS = Math.max(
      1,
      Math.round(((msg.endedAt || Date.now()) - msg.startedAt) / 1000)
    );

    return (
      <div className="max-w-[85%] space-y-1">
        <div className="rounded-2xl rounded-tl-none border border-[#22262F] bg-[#121417] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleThinking(msg.id)}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left"
          >
            {isStreaming ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35E6A4] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35E6A4]" />
              </span>
            ) : (
              <span
                className={`inline-flex h-2 w-2 rounded-full shrink-0 ${isError ? 'bg-[#FF5555]' : 'bg-[#35E6A4]/70'
                  }`}
              />
            )}
            <span className="text-xs sm:text-sm text-[#D0D4DC] font-medium">
              {isStreaming ? 'Thinking…' : isError ? `Stopped after ${elapsedS}s` : `Thought for ${elapsedS}s`}
            </span>
            <span className="ml-auto text-[#6E737D]">
              {msg.collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {!msg.collapsed && (
            <div className="px-3.5 pb-3.5">
              <div className="relative pl-5">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[#22262F]" />
                <div className="space-y-3">
                  {msg.steps.map((step) => {
                    const meta = STEP_META[step.nodeName] || { icon: Sparkles };
                    const StepIcon = meta.icon;
                    return (
                      <div key={step.key} className="relative flex items-start gap-2.5">
                        <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-[#121417] border border-[#22262F] flex items-center justify-center">
                          <StepIcon className="w-2 h-2 text-[#35E6A4]" />
                        </div>
                        <div className="text-xs leading-relaxed">
                          <span className="text-[#F7F8F8] font-medium">{step.label}</span>
                          <span className="text-[#8A8F98] font-mono"> — {step.detail}</span>
                        </div>
                      </div>
                    );
                  })}
                  {isStreaming && (
                    <div className="relative flex items-center gap-2.5 text-[#6E737D]">
                      <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 flex items-center justify-center">
                        <Loader className="w-2.5 h-2.5 animate-spin" />
                      </div>
                      <span className="text-xs italic">working…</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <span className="text-[10px] text-[#6E737D] px-1 font-mono block">
          {formatTimestamp()}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] overflow-hidden">

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept="image/*,.pdf,.csv,.json,.txt,.js,.py"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-[#22262F]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-sm ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-[#181B20] border border-[#35E6A4]/30 flex items-center justify-center text-[#35E6A4] shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            {msg.type === 'thinking' ? (
              renderThinkingBlock(msg)
            ) : (
              <div className={`max-w-[85%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3.5 rounded-2xl border text-xs sm:text-sm leading-relaxed ${msg.sender === 'user'
                  ? 'bg-[#181B20] text-[#F7F8F8] border-[#22262F] rounded-tr-none'
                  : msg.mode === 'error'
                    ? 'bg-[#1A1216] text-[#FF5555] border-[#FF5555]/30 rounded-tl-none'
                    : 'bg-[#121417] text-[#D0D4DC] border-[#22262F] rounded-tl-none'
                  }`}>
                  <p>{msg.text}</p>

                  {msg.deliverables && msg.deliverables.length > 0 && (
                    <div className="mt-3 p-3 bg-[#0B0C0E] border border-[#22262F] rounded-xl space-y-1.5">
                      {(msg.deliverables || []).map((file, idx) => (
                        <a
                          key={idx}
                          href={apiService.getDownloadUrl(file.path || file.name)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-2 py-1 rounded bg-[#121417] border border-[#22262F] text-xs text-[#F7F8F8] hover:border-[#35E6A4]/40 hover:text-[#35E6A4] transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span className="truncate">{file.name}</span>
                          <Download className="w-3 h-3 ml-auto text-[#8A8F98]" />
                        </a>
                      ))}
                    </div>
                  )}

                  {msg.codeSnippet && (
                    <div className="mt-3 p-3 bg-[#0B0C0E] border border-[#22262F] rounded-xl font-mono text-xs text-[#35E6A4] overflow-x-auto">
                      <pre>{msg.codeSnippet}</pre>
                    </div>
                  )}

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-[#22262F]">
                      {msg.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded bg-[#0B0C0E] border border-[#22262F] text-xs text-[#8A8F98]">
                          {file.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-[#35E6A4]" /> : <FileText className="w-3.5 h-3.5" />}
                          <span className="truncate max-w-[120px] text-[#F7F8F8]">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#6E737D] px-1 font-mono block">
                  {msg.timestamp}
                </span>
              </div>
            )}

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-[#181B20] border border-[#22262F] flex items-center justify-center text-[#F7F8F8] shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 bg-[#121417] border-t border-[#22262F] shrink-0 space-y-2.5">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 border-b border-[#22262F]">
            {attachments.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#181B20] border border-[#22262F] px-2.5 py-1 rounded-lg text-xs text-[#F7F8F8]">
                {file.type === 'image' ? (
                  <img src={file.url} alt="preview" className="w-4 h-4 object-cover rounded" />
                ) : (
                  <FileText className="w-4 h-4 text-[#35E6A4]" />
                )}
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button onClick={() => removeAttachment(i)} className="text-[#8A8F98] hover:text-[#FF5555] ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2.5 bg-[#0B0C0E] border border-[#22262F] focus-within:border-[#35E6A4]/50 rounded-xl px-3 py-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="text-[#8A8F98] hover:text-[#F7F8F8] p-1 shrink-0"
            title="Attach file or photo"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your instruction here..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#F7F8F8] placeholder-[#6E737D] focus:outline-none"
          />

          <button
            type="submit"
            disabled={isSending}
            className="w-8 h-8 rounded-lg bg-[#181B20] border border-[#22262F] hover:bg-[#35E6A4] hover:text-[#0B0C0E] text-[#35E6A4] flex items-center justify-center transition-all shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#181B20] disabled:hover:text-[#35E6A4]"
          >
            {isSending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-[#8A8F98] scrollbar-none py-0.5">
          <button
            onClick={() => handleToolClick('Add Workspace')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181B20] border border-[#22262F] hover:border-[#35E6A4]/40 hover:text-[#F7F8F8] shrink-0"
          >
            <FolderPlus className="w-3 h-3 text-[#E5A93C]" />
            <span>Add Workspace</span>
          </button>

          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181B20] border border-[#22262F] hover:border-[#35E6A4]/40 hover:text-[#F7F8F8] shrink-0"
          >
            <FileUp className="w-3 h-3 text-[#35E6A4]" />
            <span>Upload Files</span>
          </button>

          <button
            onClick={() => handleToolClick('Use Tools')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181B20] border border-[#22262F] hover:border-[#35E6A4]/40 hover:text-[#F7F8F8] shrink-0"
          >
            <Wrench className="w-3 h-3 text-[#737373]" />
            <span>Use Tools</span>
          </button>

          <button
            onClick={() => handleToolClick('Create Document')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181B20] border border-[#22262F] hover:border-[#35E6A4]/40 hover:text-[#F7F8F8] shrink-0"
          >
            <FileText className="w-3 h-3 text-[#3B82F6]" />
            <span>Create Document</span>
          </button>

          <button
            onClick={() => handleToolClick('Write Code')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181B20] border border-[#22262F] hover:border-[#35E6A4]/40 hover:text-[#F7F8F8] shrink-0"
          >
            <Code2 className="w-3 h-3 text-[#A855F7]" />
            <span>Write Code</span>
          </button>

          <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#181B20] border border-[#22262F] hover:text-[#F7F8F8] shrink-0 ml-auto">
            <span>More</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 bg-[#0B0C0E] border-t border-[#22262F] flex items-center justify-between text-xs text-[#8A8F98] shrink-0">
        <div className="flex items-center gap-2 font-medium text-[#F7F8F8]">
          <Sparkles className="w-3.5 h-3.5 text-[#35E6A4]" />
          <span>Generated Outputs</span>
        </div>
        <button className="flex items-center gap-1 px-2.5 py-0.5 bg-[#121417] border border-[#22262F] rounded-md text-[#8A8F98] hover:text-[#F7F8F8]">
          <FileText className="w-3 h-3 text-[#3B82F6]" />
          <span>View in Folder</span>
          <ChevronDown className="w-3 h-3 ml-1" />
        </button>
      </div>

    </div>
  );
}