import { useState, useEffect, useCallback } from 'react';

// Layout Components
import MetaSEO from '../components/layout/MetaSEO';
import Header from '../components/layout/Header';
import AuditFooter from '../components/layout/AuditFooter';

// Workspace Components
import DocumentSidebar from '../components/workspace/DocumentSidebar';
import DagPipeline from '../components/workspace/DagPipeline';
import RoiCanvas from '../components/workspace/RoiCanvas';
import AiStreamView from '../components/workspace/AiStreamView';
import TerminalConsole from '../components/workspace/TerminalConsole';
import Deliverables from '../components/workspace/Deliverables';

// Integrated Codex Chatbot Component
import CodexChatbot from '../components/workspace/CodexChatbot';
import Modal from '../components/ui/Modal';

export default function Workbench() {
  const [activeTab, setActiveTab] = useState('codex'); // 'codex' | 'canvas' | 'stream'
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeDoc, setActiveDoc] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('workbench_active_doc') || 'null');
    } catch {
      return null;
    }
  });
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectDocument = useCallback((doc) => {
    setActiveDoc(doc);
    try {
      localStorage.setItem('workbench_active_doc', JSON.stringify(doc));
    } catch {
      /* storage unavailable */
    }
    setCurrentStep(2);
    showToast(`Loaded Document: ${doc?.name || 'Selected File'}`);
  }, [showToast]);

  const handleRoiCaptured = useCallback((roiData) => {
    if (roiData) {
      setCurrentStep(3);
      showToast(`Captured ROI (${Math.round(roiData.width)}x${Math.round(roiData.height)}). Processing AI Insights...`);
      setTimeout(() => setActiveTab('stream'), 800);
    }
  }, [showToast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setActiveTab((prev) => {
          const next = prev === 'codex' ? 'canvas' : prev === 'canvas' ? 'stream' : 'codex';
          showToast(`Switched view to: ${next === 'codex' ? 'Codex Assistant' : next === 'canvas' ? 'Crop & Scan' : 'AI Text Insights'}`);
          return next;
        });
      }
      if (e.key === 'Escape') {
        setShowInfoModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  return (
    <>
      <MetaSEO title="Sovereign AI Workbench" />

      <div className="h-screen max-h-screen w-full flex flex-col bg-[#0B0C0E] overflow-hidden font-sans select-none text-[#F7F8F8]">
        {Header && <Header />}

        {/* Top Banner */}
        <div className="bg-[#121417] border-b border-[#22262F] px-4 py-1.5 flex items-center justify-between text-xs text-[#8A8F98] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#35E6A4]" />
            <span className="truncate">
              <strong className="text-[#F7F8F8] font-medium">Workspace Active:</strong> Use AI Chatbot or select an area on your document to scan specific text.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-mono text-[#6E737D] hidden md:inline">
              Press <kbd className="px-1.5 py-0.5 bg-[#181B20] text-[#D0D6E0] rounded border border-[#22262F]">Space</kbd> to toggle views
            </span>
            <button onClick={() => setShowInfoModal(true)} className="text-[#35E6A4] hover:underline font-medium text-xs">
              How it works?
            </button>
          </div>
        </div>

        {/* Core Main Grid */}
        <div className="flex-1 grid grid-cols-12 gap-2 bg-[#0B0C0E] p-2 overflow-hidden min-h-0">

          {/* Panel 1: Document Select */}
          <section className="col-span-12 md:col-span-3 bg-[#121417]/60 border border-[#22262F] rounded-xl flex flex-col overflow-hidden min-h-0">
            <div className="px-3 py-2 border-b border-[#22262F] bg-[#121417] flex items-center justify-between shrink-0">
              <h2 className="text-xs font-semibold text-[#F7F8F8] flex items-center gap-1.5">
                <span className="text-[#35E6A4]">01</span> Document Select
              </h2>
              <span className="text-[10px] bg-[#181B20] text-[#8A8F98] px-2 py-0.5 rounded border border-[#22262F] font-mono">
                Local Storage
              </span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <DocumentSidebar activeDoc={activeDoc} onSelectDocument={handleSelectDocument} />
            </div>
          </section>

          {/* Panel 2: Center Interactive Workspace */}
          <section className="col-span-12 md:col-span-6 flex flex-col gap-2 overflow-hidden min-h-0">
            <div className="bg-[#121417]/60 border border-[#22262F] rounded-xl p-2 shrink-0">
              <div className="text-[10px] font-mono text-[#8A8F98] mb-1 flex justify-between items-center uppercase">
                <span>Workflow Pipeline</span>
                <span className="text-[#35E6A4] text-[10px] bg-[#35E6A4]/10 px-2 py-0.5 rounded border border-[#35E6A4]/20">
                  Step {currentStep} of 4 Active
                </span>
              </div>
              <DagPipeline currentStep={currentStep} />
            </div>

            <div className="flex-1 bg-[#121417]/60 border border-[#22262F] rounded-xl overflow-hidden flex flex-col min-h-0">
              <div className="px-3 py-1.5 border-b border-[#22262F] bg-[#121417] flex items-center justify-between shrink-0">
                <h2 className="text-xs font-semibold text-[#F7F8F8] flex items-center gap-1.5">
                  <span className="text-[#35E6A4]">02</span> Interactive Workspace
                </h2>

                <div className="flex bg-[#0B0C0E] p-0.5 rounded-lg border border-[#22262F] text-xs">
                  <button onClick={() => setActiveTab('codex')} className={`px-2.5 py-1 rounded-md text-xs font-medium ${activeTab === 'codex' ? 'bg-[#22262F] text-[#35E6A4]' : 'text-[#8A8F98]'}`}>
                    Codex AI Bot
                  </button>
                  <button onClick={() => setActiveTab('canvas')} className={`px-2.5 py-1 rounded-md text-xs font-medium ${activeTab === 'canvas' ? 'bg-[#22262F] text-[#F7F8F8]' : 'text-[#8A8F98]'}`}>
                    Crop & Scan Target
                  </button>
                  <button onClick={() => setActiveTab('stream')} className={`px-2.5 py-1 rounded-md text-xs font-medium ${activeTab === 'stream' ? 'bg-[#22262F] text-[#F7F8F8]' : 'text-[#8A8F98]'}`}>
                    AI Text Insights
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative min-h-0">
                {activeTab === 'codex' ? (
                  <CodexChatbot activeDoc={activeDoc} />
                ) : activeTab === 'canvas' ? (
                  <RoiCanvas activeDoc={activeDoc} onSelectFile={handleSelectDocument} onRoiCaptured={handleRoiCaptured} />
                ) : (
                  <AiStreamView activeDoc={activeDoc} />
                )}
              </div>
            </div>
          </section>

          {/* Panel 3: Right Side (Logs & Deliverables) */}
          <section className="col-span-12 md:col-span-3 flex flex-col gap-2 overflow-hidden min-h-0">
            {/* Terminal Log */}
            <div className="flex-1 bg-[#121417]/60 border border-[#22262F] rounded-xl flex flex-col overflow-hidden min-h-0">
              <div className="px-3 py-2 border-b border-[#22262F] bg-[#121417] flex items-center justify-between shrink-0">
                <h2 className="text-xs font-semibold text-[#F7F8F8] flex items-center gap-1.5">
                  <span className="text-[#35E6A4]">03</span> Activity & Security Log
                </h2>
                <span className="text-[10px] bg-[#35E6A4]/10 text-[#35E6A4] border border-[#35E6A4]/20 px-2 py-0.5 rounded font-mono">
                  Isolated Sandbox
                </span>
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <TerminalConsole />
              </div>
            </div>

            {/* Deliverables */}
            <div className="h-48 bg-[#121417]/60 border border-[#22262F] rounded-xl flex flex-col overflow-hidden shrink-0">
              <div className="px-3 py-2 border-b border-[#22262F] bg-[#121417] flex items-center justify-between shrink-0">
                <h2 className="text-xs font-semibold text-[#F7F8F8] flex items-center gap-1.5">
                  <span className="text-[#35E6A4]">04</span> Downloadable Reports
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <Deliverables onExportComplete={() => setCurrentStep(4)} />
              </div>
            </div>
          </section>

        </div>

        {AuditFooter && <AuditFooter />}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#121417] border border-[#35E6A4]/40 text-[#F7F8F8] text-xs font-mono px-4 py-2 rounded-lg shadow-xl">
          <span className="text-[#35E6A4]">●</span> {toastMessage}
        </div>
      )}

      {/* How it works Modal */}
      <Modal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} title="SOVEREIGN WORKBENCH">
        <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
          <p><span className="text-amber-400 font-mono">01</span> Select or upload a document in the sidebar — text/PDFs are auto-indexed into the local RAG knowledge base.</p>
          <p><span className="text-amber-400 font-mono">02</span> Use the <span className="text-emerald-400">Codex AI Bot</span> to ask questions, run calculations, or extract data from the attached document.</p>
          <p><span className="text-amber-400 font-mono">03</span> In <span className="text-emerald-400">Crop &amp; Scan Target</span>, draw a box over a region to target OCR.</p>
          <p><span className="text-amber-400 font-mono">04</span> View the agent's live steps in <span className="text-emerald-400">AI Text Insights</span> and download generated reports under <span className="text-emerald-400">Downloadable Reports</span>.</p>
          <p className="text-slate-500 font-mono">All inference runs locally. No data leaves the premises.</p>
        </div>
      </Modal>
    </>
  );
}