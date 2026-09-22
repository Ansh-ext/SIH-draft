import React from 'react';
import MetaSEO from '../components/layout/MetaSEO';

export default function About() {
  return (
    <>
      <MetaSEO 
        title="System Architecture - Sovereign AI" 
        description="Air-gapped execution, local vector stores, and isolated vision processing."
      />

      <div className="min-h-screen bg-[#0B0C0E] text-[#F7F8F8] pt-20 pb-28 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-16">
          
          {/* Header */}
          <div className="border-b border-[#22262F] pb-12">
            <span className="text-[11px] font-mono text-[#35E6A4] uppercase tracking-wider block mb-3">
              System Specification & Architecture
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#F7F8F8] mb-4">
              Air-Gapped Sovereign Engine
            </h1>
            <p className="text-[#8A8F98] text-base leading-relaxed max-w-2xl font-normal">
              Built specifically for air-gapped environments where external third-party LLM API calls, cloud telemetry, or sensitive document leakage are unacceptable risks.
            </p>
          </div>

          {/* Architecture Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#121417]/80 border border-[#22262F] p-6 rounded-xl hover:border-[#2F3440] transition-colors">
              <div className="text-xs font-mono text-[#35E6A4] mb-2">01 / AIR-GAP ENFORCEMENT</div>
              <h3 className="text-sm font-semibold text-[#F7F8F8] mb-2">Zero Outbound Telemetry</h3>
              <p className="text-[#8A8F98] text-xs leading-relaxed">
                All vision model inference and OCR routines execute entirely on local GPU/CPU hardware without generating a single network packet.
              </p>
            </div>

            <div className="bg-[#121417]/80 border border-[#22262F] p-6 rounded-xl hover:border-[#2F3440] transition-colors">
              <div className="text-xs font-mono text-[#35E6A4] mb-2">02 / LOCAL VECTOR RAG</div>
              <h3 className="text-sm font-semibold text-[#F7F8F8] mb-2">Embedded ChromaDB Index</h3>
              <p className="text-[#8A8F98] text-xs leading-relaxed">
                Document chunks and region embeddings are stored locally within an in-memory or disk-backed vector database paired with local BM25 keyword search.
              </p>
            </div>

            <div className="bg-[#121417]/80 border border-[#22262F] p-6 rounded-xl hover:border-[#2F3440] transition-colors">
              <div className="text-xs font-mono text-[#35E6A4] mb-2">03 / ISOLATED SANDBOX</div>
              <h3 className="text-sm font-semibold text-[#F7F8F8] mb-2">WASM & Docker Sandboxing</h3>
              <p className="text-[#8A8F98] text-xs leading-relaxed">
                Data extraction verification scripts run in isolated WASM runtimes or ephemeral Docker containers configured with network bindings disabled.
              </p>
            </div>

            <div className="bg-[#121417]/80 border border-[#22262F] p-6 rounded-xl hover:border-[#2F3440] transition-colors">
              <div className="text-xs font-mono text-[#35E6A4] mb-2">04 / DELIVERABLE GENERATOR</div>
              <h3 className="text-sm font-semibold text-[#F7F8F8] mb-2">Native Local Export</h3>
              <p className="text-[#8A8F98] text-xs leading-relaxed">
                Extracted data maps directly to structured enterprise formats (<code className="text-[#F7F8F8] font-mono">.xlsx</code>, <code className="text-[#F7F8F8] font-mono">.json</code>, <code className="text-[#F7F8F8] font-mono">.pdf</code>) right from client memory.
              </p>
            </div>
          </div>

          {/* Execution Pipeline Sequence */}
          <div className="bg-[#121417] border border-[#22262F] rounded-xl p-8 space-y-6">
            <h2 className="text-lg font-semibold text-[#F7F8F8]">Execution Pipeline Sequence</h2>
            <div className="space-y-4 text-xs text-[#8A8F98] font-mono">
              <div className="flex items-start gap-4">
                <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#22262F] text-[#35E6A4] text-[10px] font-semibold">01</span>
                <span>User document ingestion & ROI region drag selection on web canvas.</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#22262F] text-[#35E6A4] text-[10px] font-semibold">02</span>
                <span>FastAPI / ONNX engine dispatches crop coordinates to local vision OCR.</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#22262F] text-[#35E6A4] text-[10px] font-semibold">03</span>
                <span>Contextual chunk matching via local ChromaDB vector store.</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#22262F] text-[#35E6A4] text-[10px] font-semibold">04</span>
                <span>Verification script execution inside network-isolated sandbox.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}