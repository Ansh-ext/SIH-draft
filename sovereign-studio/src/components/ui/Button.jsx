import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center font-mono font-bold rounded transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    outline: 'border border-amber-500/40 text-amber-400 hover:bg-amber-500/10',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const sizes = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <button
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}