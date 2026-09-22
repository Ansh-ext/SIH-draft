import { useEffect, useRef, useState } from 'react';
import { apiService } from '../../services/api';

export default function DocumentSidebar({
  activeDoc,
  onSelectDocument,
  selectedModel,
  setSelectedModel
}) {
  const fileInputRef = useRef(null);
  const pollTimersRef = useRef([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ingestStates, setIngestStates] = useState({});

  useEffect(() => {
    const timers = pollTimersRef.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  function pollIngest(fileId) {
    const tick = async () => {
      const st = await apiService.getIngestStatus(fileId);
      setIngestStates((prev) => ({ ...prev, [fileId]: st }));
      if (st.status === 'queued' || st.status === 'running') {
        pollTimersRef.current.push(setTimeout(tick, 3000));
      } else {
        if (st.status === 'error') {
          console.error('Ingest failed:', st.error);
        }
        const docs = await apiService.getDocuments();
        setDocuments(docs);
      }
    };
    tick();
  }

  async function refreshDocuments() {
    setLoading(true);
    const docs = await apiService.getDocuments();
    setDocuments(docs);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const docs = await apiService.getDocuments();
      if (active) setDocuments(docs);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await apiService.uploadDocument(file, 'general');
      setDocuments((prev) => [...prev, uploaded]);
      if (uploaded.file_id) pollIngest(uploaded.file_id);
      if (onSelectDocument) onSelectDocument(uploaded);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs p-3 bg-[#0B0C0E] h-full">
      
      {/* 1. Vision/OCR Model Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8F98]">
          Processing Vision Engine
        </label>
        <select
          value={selectedModel || 'tesseract-ocr'}
          onChange={(e) => setSelectedModel && setSelectedModel(e.target.value)}
          className="w-full bg-[#121417] border border-[#22262F] rounded-lg px-3 py-2 text-[#F7F8F8] focus:outline-none focus:border-[#35E6A4] font-mono text-xs cursor-pointer transition-colors"
        >
          <option value="tesseract-ocr">Tesseract Local OCR (Fast & Lightweight)</option>
          <option value="qwen3-vision">Qwen3-VL 8B (Vision Document LLM)</option>
          <option value="easyocr-gpu">EasyOCR WebGPU (Table Parser)</option>
        </select>
      </div>

      {/* 2. Drag & Drop File Upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8F98]">
          Upload Local Document
        </label>
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border border-dashed border-[#22262F] hover:border-[#35E6A4]/60 bg-[#121417]/50 hover:bg-[#121417] rounded-xl p-4 text-center cursor-pointer transition-all group ${
            uploading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
            className="hidden"
          />
          <div className="w-8 h-8 rounded-full bg-[#35E6A4]/10 border border-[#35E6A4]/20 flex items-center justify-center text-[#35E6A4] mx-auto mb-2 group-hover:scale-105 transition-transform">
            ↑
          </div>
          <p className="font-medium text-[#F7F8F8]">{uploading ? 'Uploading...' : 'Click or drag local file'}</p>
          <p className="text-[10px] text-[#6E737D] mt-1 font-mono">Supports PDF, PNG, JPG, TXT (Air-gapped)</p>
        </div>
      </div>

      {/* 3. Documents from Backend */}
      <div className="flex flex-col gap-1.5 mt-1">
        <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8F98] flex items-center justify-between">
          <span>Documents</span>
          <button
            onClick={refreshDocuments}
            className="text-[9px] text-[#35E6A4] font-normal lowercase hover:underline"
          >
            ↻ refresh
          </button>
        </label>

        {loading && <p className="text-[10px] text-[#6E737D] font-mono">Loading...</p>}

        {Object.values(ingestStates).some((s) => s.status === 'queued' || s.status === 'running') && (
          <p className="text-[10px] text-[#E5A93C] font-mono animate-pulse">
            ⏳ Indexing into knowledge base…
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          {documents.length === 0 && !loading && (
            <p className="text-[10px] text-[#6E737D] font-mono">No documents uploaded yet.</p>
          )}
          {documents.map((doc) => {
            const isSelected = activeDoc?.id === doc.id || activeDoc?.name === doc.name;
            const ingestStatus = ingestStates[doc.file_id]?.status || doc.ingest_status || null;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument && onSelectDocument(doc)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#121417] border-[#35E6A4] text-[#F7F8F8]'
                    : 'bg-[#121417]/40 border-[#22262F] text-[#8A8F98] hover:border-[#35E6A4]/40 hover:text-[#F7F8F8]'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-xs">📄</span>
                  <div className="truncate">
                    <p className="font-medium text-xs truncate text-[#F7F8F8]">{doc.name}</p>
                    <p className="text-[10px] text-[#6E737D] font-mono">{doc.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ingestStatus === 'done' && (
                    <span className="text-[9px] font-mono text-[#35E6A4]">✓ indexed</span>
                  )}
                  {ingestStatus === 'error' && (
                    <span className="text-[9px] font-mono text-[#FF5555]">✗ failed</span>
                  )}
                  {(ingestStatus === 'queued' || ingestStatus === 'running') && (
                    <span className="text-[9px] font-mono text-[#E5A93C] animate-pulse">⏳ indexing</span>
                  )}
                  <span className="text-[10px] font-mono text-[#6E737D]">{doc.size}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}