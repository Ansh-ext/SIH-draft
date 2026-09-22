import React from 'react';

export default function Header() {
  return (
    <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
          Air-Gapped Local Engine
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
          Qwen3-VL / Local RAG Active
        </span>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Docker Sandbox: Idle
        </span>
      </div>
    </div>
  );
}