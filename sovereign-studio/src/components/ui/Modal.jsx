import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-amber-500 uppercase">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 font-mono text-xs"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}