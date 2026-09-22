import React from 'react';

export default function DagPipeline({ currentStep = 1 }) {
  const steps = [
    { id: 1, name: 'OCR Engine', detail: 'Tesseract / Qwen3' },
    { id: 2, name: 'Hybrid RAG', detail: 'ChromaDB Local' },
    { id: 3, name: 'Local Sandbox', detail: 'Isolated Runner' },
    { id: 4, name: 'Report Generator', detail: 'PDF / XLSX Engine' },
  ];

  return (
    <div className="w-full bg-[#0B0C0E] p-1.5 rounded-lg border border-[#22262F]">
      <div className="grid grid-cols-4 gap-1.5">
        {steps.map((step) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`p-2 rounded-md border font-mono text-[11px] transition-colors flex flex-col justify-between ${
                isActive
                  ? 'bg-[#121417] border-[#35E6A4] text-[#F7F8F8]'
                  : isDone
                  ? 'bg-[#121417]/40 border-[#22262F] text-[#35E6A4]'
                  : 'bg-[#0B0C0E] border-[#22262F]/60 text-[#6E737D]'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] text-[#6E737D] mb-1">
                <span>0{step.id}</span>
                {isDone && <span className="text-[#35E6A4] font-semibold">DONE</span>}
                {isActive && <span className="text-[#35E6A4] animate-pulse font-semibold">RUNNING</span>}
                {!isDone && !isActive && <span>IDLE</span>}
              </div>
              <div className="font-semibold text-xs tracking-tight truncate text-[#F7F8F8]">
                {step.name}
              </div>
              <div className="text-[9px] text-[#8A8F98] truncate mt-0.5">
                {step.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}