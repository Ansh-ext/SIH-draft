import { useState } from 'react';
import { Loader } from 'lucide-react';
import { apiService } from '../../services/api';

export default function AiStreamView({ activeDoc }) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [extractedText, setExtractedText] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  const docName = activeDoc?.name || activeDoc?.path || null;
  const docPath = activeDoc?.path || null;

  const handleExtract = async () => {
    if (!docPath || isExtracting) return;
    setIsExtracting(true);
    setError(null);
    setExtractedText(null);
    setMeta(null);
    try {
      const result = await apiService.sendAgentQuery(
        'Extract all text and key details from the attached document.',
        { attached_file: docPath, department: 'general' }
      );
      setExtractedText(result.final_answer || 'No extraction result returned.');
      setMeta({
        task_type: result.task_type,
        model_tag: result.model_tag,
        confidence: result.confidence_scores || [],
        iterations: result.iteration_count,
        audit_valid: result.audit_valid,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopy = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  if (!activeDoc) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#0B0C0E]">
        <div className="w-10 h-10 bg-[#121417] border border-[#22262F] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#35E6A4] font-mono text-xs">
          ⚡
        </div>
        <h3 className="text-xs font-semibold text-[#F7F8F8] mb-1">No Extraction Stream Active</h3>
        <p className="text-[11px] text-[#8A8F98] max-w-xs leading-relaxed">
          Select a document in the sidebar, then view AI-extracted text and insights here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0B0C0E] text-[#F7F8F8] overflow-hidden">
      {/* Control Bar */}
      <div className="bg-[#121417] border-b border-[#22262F] px-3 py-2 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className={`w-2 h-2 rounded-full bg-[#35E6A4] ${isExtracting ? 'animate-pulse' : ''}`} />
          <span className="text-[#F7F8F8] font-medium tracking-tight">DOCUMENT EXTRACTION</span>
          <span className="text-[#22262F]">|</span>
          <span className="text-[#35E6A4]">{docName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="px-2.5 py-1 bg-[#35E6A4] hover:bg-[#2FD193] text-[#0B0C0E] font-mono text-[10px] font-semibold rounded border border-transparent transition-colors cursor-pointer disabled:opacity-50"
          >
            {isExtracting ? 'Extracting...' : '▶ Extract Text'}
          </button>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 bg-[#181B20] hover:bg-[#22262F] text-[#D0D6E0] rounded font-mono text-[10px] border border-[#22262F] transition-colors cursor-pointer"
          >
            {isCopying ? '✓ Copied' : '📋 Copy Plain Text'}
          </button>
        </div>
      </div>

      {/* Stream View Body */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs leading-relaxed space-y-3">
        {isExtracting && (
          <div className="flex items-center gap-2 text-[#35E6A4]">
            <Loader className="w-3.5 h-3.5 animate-spin" />
            <span>Agent is extracting text from the document...</span>
          </div>
        )}

        {error && (
          <div className="border border-[#FF5555]/40 bg-[#FF5555]/5 rounded-lg p-3 text-[#FF5555]">
            Extraction failed: {error}. Make sure the backend is running (python run.py).
          </div>
        )}

        {extractedText && (
          <div className="border border-[#22262F] bg-[#121417] rounded-lg p-3">
            <pre className="text-[#35E6A4] whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {extractedText}
            </pre>
          </div>
        )}

        {/* Structured JSON Summary */}
        {meta && (
          <div className="border border-[#22262F] rounded-lg p-3 bg-[#121417]/80">
            <h4 className="text-[10px] font-semibold text-[#8A8F98] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
              <span>🏷️</span> Agent Processing Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#0B0C0E] p-2 rounded border border-[#22262F]">
                <span className="text-[#6E737D] block text-[9px] font-mono uppercase">TASK TYPE</span>
                <span className="font-medium text-[#F7F8F8]">{meta.task_type}</span>
              </div>
              <div className="bg-[#0B0C0E] p-2 rounded border border-[#22262F]">
                <span className="text-[#6E737D] block text-[9px] font-mono uppercase">MODEL</span>
                <span className="font-medium text-[#35E6A4]">{meta.model_tag}</span>
              </div>
              <div className="bg-[#0B0C0E] p-2 rounded border border-[#22262F]">
                <span className="text-[#6E737D] block text-[9px] font-mono uppercase">ITERATIONS</span>
                <span className="font-medium text-[#F7F8F8]">{meta.iterations}</span>
              </div>
              <div className="bg-[#0B0C0E] p-2 rounded border border-[#22262F]">
                <span className="text-[#6E737D] block text-[9px] font-mono uppercase">AUDIT CHAIN</span>
                <span className={`font-medium ${meta.audit_valid ? 'text-[#35E6A4]' : 'text-[#FF5555]'}`}>
                  {meta.audit_valid ? 'Verified' : 'Failed'}
                </span>
              </div>
            </div>
          </div>
        )}

        {!isExtracting && !extractedText && !error && (
          <div className="text-[#6E737D] text-[11px]">
            Select a document, then press <span className="text-[#35E6A4]">▶ Extract Text</span> to run local OCR/RAG extraction via the backend.
          </div>
        )}
      </div>
    </div>
  );
}