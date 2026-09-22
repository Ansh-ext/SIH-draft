import React from 'react';

export default function Badge({ type = 'default', children, className = '' }) {
  const styles = {
    default: 'bg-slate-800 text-slate-400 border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono border ${styles[type]} ${className}`}>
      {children}
    </span>
  );
}