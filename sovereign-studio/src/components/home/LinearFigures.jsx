import React from 'react';

export default function LinearFigures() {
  return (
    <section className="bg-[#0B0C0E] py-24 px-6 border-t border-[#22262F]">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Asymmetric Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <h2 className="md:col-span-6 text-3xl md:text-5xl font-bold text-[#F7F8F8] tracking-tight leading-tight">
            Built for enterprise confidentiality. <br />
            <span className="text-[#8A8F98]">100% Offline Document Intelligence.</span>
          </h2>
          <p className="md:col-span-6 text-[#8A8F98] text-base md:text-lg font-normal leading-relaxed">
            Sovereign AI replaces cloud API dependencies with a local multi-stage pipeline. Extract layout tables, run localized vision models, and execute code within air-gapped runtimes.
          </p>
        </div>

        {/* 3 Isometric Figures mapped to Sovereign AI features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#22262F] rounded-xl overflow-hidden border border-[#22262F]">
          
          {/* FIG 0.1 - ROI & Vision OCR */}
          <div className="bg-[#121417] p-8 flex flex-col justify-between h-[460px] group hover:bg-[#16191E] transition-all duration-300">
            <span className="text-[11px] font-mono tracking-widest text-[#6E737D]">FIG 0.1 — LAYOUT & ROI</span>
            
            <div className="flex-1 flex items-center justify-center my-2 relative">
              <div className="absolute inset-0 bg-[#35E6A4]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <svg className="w-64 h-64 stroke-[#6E737D] group-hover:stroke-[#35E6A4] transition-all duration-500 fill-none group-hover:scale-105 transform" viewBox="0 0 240 240">
                {/* Background Grid Lines */}
                <path d="M20 40 H220 M20 80 H220 M20 120 H220 M20 160 H220 M20 200 H220" stroke="#22262F" strokeWidth="1" strokeDasharray="2 4" />
                <path d="M40 20 V220 M80 20 V220 M120 20 V220 M160 20 V220 M200 20 V220" stroke="#22262F" strokeWidth="1" strokeDasharray="2 4" />

                {/* Main Document Canvas */}
                <rect x="45" y="30" width="150" height="180" rx="6" className="fill-[#0B0C0E]/80 stroke-[#3A3F4D] group-hover:stroke-[#35E6A4]/40" strokeWidth="1.5" />
                
                {/* Document Header lines */}
                <line x1="65" y1="50" x2="115" y2="50" strokeWidth="2.5" className="stroke-[#8A8F98]" />
                <line x1="65" y1="62" x2="155" y2="62" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Primary Detected Bounding Box (ROI) */}
                <rect x="60" y="80" width="120" height="65" rx="4" className="stroke-[#35E6A4]" strokeWidth="2" fill="url(#roi-gradient)" />
                <path d="M70 98 H160 M70 110 H140 M70 122 H155" strokeWidth="1.5" className="stroke-[#35E6A4]" strokeDasharray="2 2" />

                {/* Bounding Box Corner Indicators */}
                <path d="M55 75 V85 M55 75 H65" className="stroke-[#35E6A4]" strokeWidth="2" />
                <path d="M185 75 V85 M185 75 H175" className="stroke-[#35E6A4]" strokeWidth="2" />
                <path d="M55 150 V140 M55 150 H65" className="stroke-[#35E6A4]" strokeWidth="2" />
                <path d="M185 150 V140 M185 150 H175" className="stroke-[#35E6A4]" strokeWidth="2" />

                {/* Scanning Laser Beam Effect */}
                <line x1="40" y1="112.5" x2="200" y2="112.5" stroke="#35E6A4" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Bottom Text Content */}
                <line x1="65" y1="162" x2="175" y2="162" strokeWidth="1.5" strokeDasharray="4 2" />
                <line x1="65" y1="174" x2="135" y2="174" strokeWidth="1.5" strokeDasharray="4 2" />
                <line x1="65" y1="186" x2="160" y2="186" strokeWidth="1.5" strokeDasharray="4 2" />

                {/* Coordinate Label */}
                <rect x="110" y="132" x2="175" y2="142" className="fill-[#121417] stroke-[#35E6A4]" strokeWidth="1" />
                <text x="115" y="140" fill="#35E6A4" fontSize="8" fontFamily="monospace">[x:60, y:80]</text>

                <defs>
                  <linearGradient id="roi-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#35E6A4" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#35E6A4" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="space-y-1 z-10">
              <div className="text-sm font-mono text-[#F7F8F8] font-medium">Vision & Bounding Box OCR</div>
              <div className="text-xs text-[#8A8F98] leading-relaxed">Extract coordinates `[x,y,w,h]` and structured text from complex scanned PDFs.</div>
            </div>
          </div>

          {/* FIG 0.2 - Local RAG & Chroma Vectoring */}
          <div className="bg-[#121417] p-8 flex flex-col justify-between h-[460px] group hover:bg-[#16191E] transition-all duration-300">
            <span className="text-[11px] font-mono tracking-widest text-[#6E737D]">FIG 0.2 — LOCAL RAG</span>
            
            <div className="flex-1 flex items-center justify-center my-2 relative">
              <div className="absolute inset-0 bg-[#35E6A4]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <svg className="w-64 h-64 stroke-[#6E737D] group-hover:stroke-[#35E6A4] transition-all duration-500 fill-none group-hover:scale-105 transform" viewBox="0 0 240 240">
                {/* Concentric Vector Orbit Rings */}
                <circle cx="120" cy="120" r="95" stroke="#22262F" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="120" cy="120" r="65" stroke="#22262F" strokeWidth="1" />
                <circle cx="120" cy="120" r="35" stroke="#22262F" strokeWidth="1" strokeDasharray="2 2" />

                {/* Mesh Interconnections */}
                <path d="M120 25 L65 75 L30 140 L85 195 L155 195 L210 140 L175 75 Z" strokeWidth="1" className="stroke-[#3A3F4D] group-hover:stroke-[#35E6A4]/30" />
                <path d="M65 75 L175 75 M30 140 L210 140 M85 195 L155 195" strokeWidth="1" strokeDasharray="2 4" className="stroke-[#3A3F4D]" />
                <path d="M120 25 L120 215 M25 120 L215 120" strokeWidth="1" strokeDasharray="4 4" stroke="#22262F" />

                {/* Central Primary Vector Node */}
                <circle cx="120" cy="120" r="12" className="fill-[#121417] stroke-[#35E6A4]" strokeWidth="2.5" />
                <circle cx="120" cy="120" r="4" className="fill-[#35E6A4]" />

                {/* Outer Vector Nodes */}
                <circle cx="120" cy="25" r="5" className="fill-[#121417] group-hover:fill-[#35E6A4]" strokeWidth="1.5" />
                <circle cx="65" cy="75" r="6" className="fill-[#121417] group-hover:fill-[#35E6A4]" strokeWidth="1.5" />
                <circle cx="175" cy="75" r="5" className="fill-[#121417] group-hover:fill-[#35E6A4]" strokeWidth="1.5" />
                <circle cx="30" cy="140" r="6" className="fill-[#121417] group-hover:fill-[#35E6A4]" strokeWidth="1.5" />
                <circle cx="210" cy="140" r="6" className="fill-[#121417] group-hover:fill-[#35E6A4]" strokeWidth="1.5" />
                <circle cx="85" cy="195" r="5" className="fill-[#121417] group-hover:fill-[#35E6A4]" strokeWidth="1.5" />
                <circle cx="155" cy="195" r="6" className="fill-[#121417] group-hover:fill-[#35E6A4]" strokeWidth="1.5" />

                {/* Dynamic Query Pulse Lines */}
                <path d="M120 120 L175 75" className="stroke-[#35E6A4]" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M120 120 L30 140" className="stroke-[#35E6A4]" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </div>

            <div className="space-y-1 z-10">
              <div className="text-sm font-mono text-[#F7F8F8] font-medium">On-Device Vector Indexing</div>
              <div className="text-xs text-[#8A8F98] leading-relaxed">Hybrid BM25 + ONNX embedding model inside local ChromaDB instance.</div>
            </div>
          </div>

          {/* FIG 0.3 - WASM Execution Sandbox */}
          <div className="bg-[#121417] p-8 flex flex-col justify-between h-[460px] group hover:bg-[#16191E] transition-all duration-300">
            <span className="text-[11px] font-mono tracking-widest text-[#6E737D]">FIG 0.3 — SANDBOX</span>
            
            <div className="flex-1 flex items-center justify-center my-2 relative">
              <div className="absolute inset-0 bg-[#35E6A4]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <svg className="w-64 h-64 stroke-[#6E737D] group-hover:stroke-[#35E6A4] transition-all duration-500 fill-none group-hover:scale-105 transform" viewBox="0 0 240 240">
                {/* Outer Security Perimeter */}
                <polygon points="120,20 200,60 200,180 120,220 40,180 40,60" strokeWidth="1" strokeDasharray="4 4" stroke="#3A3F4D" />
                <polygon points="120,32 188,66 188,174 120,208 52,174 52,66" strokeWidth="1.5" className="group-hover:stroke-[#35E6A4]/50" />

                {/* Inner Sandboxed Execution Window */}
                <rect x="70" y="70" width="100" height="100" rx="6" className="fill-[#0B0C0E] stroke-[#3A3F4D] group-hover:stroke-[#35E6A4]" strokeWidth="1.5" />
                
                {/* Window Bar Header */}
                <path d="M70 88 H170" strokeWidth="1" className="stroke-[#22262F]" />
                <circle cx="82" cy="79" r="2" fill="#F2A900" stroke="none" />
                <circle cx="90" cy="79" r="2" fill="#35E6A4" stroke="none" />
                <circle cx="98" cy="79" r="2" fill="#6E737D" stroke="none" />

                {/* Terminal Prompt Graphics inside Sandbox */}
                <path d="M82 102 L92 110 L82 118" className="stroke-[#35E6A4]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="98" y1="118" x2="114" y2="118" className="stroke-[#35E6A4]" strokeWidth="2" strokeLinecap="round" />

                {/* Execution Output Simulation Lines */}
                <line x1="82" y1="130" x2="145" y2="130" strokeWidth="1.5" strokeDasharray="3 2" className="stroke-[#8A8F98]" />
                <line x1="82" y1="140" x2="130" y2="140" strokeWidth="1.5" strokeDasharray="3 2" className="stroke-[#8A8F98]" />
                <line x1="82" y1="150" x2="155" y2="150" strokeWidth="1.5" strokeDasharray="2 2" className="stroke-[#35E6A4]" />

                {/* Air-gap Isolation Lock Nodes */}
                <circle cx="120" cy="20" r="4" className="fill-[#35E6A4]" stroke="none" />
                <circle cx="200" cy="60" r="4" className="fill-[#35E6A4]" stroke="none" />
                <circle cx="200" cy="180" r="4" className="fill-[#35E6A4]" stroke="none" />
                <circle cx="120" cy="220" r="4" className="fill-[#35E6A4]" stroke="none" />
                <circle cx="40" cy="180" r="4" className="fill-[#35E6A4]" stroke="none" />
                <circle cx="40" cy="60" r="4" className="fill-[#35E6A4]" stroke="none" />
              </svg>
            </div>

            <div className="space-y-1 z-10">
              <div className="text-sm font-mono text-[#F7F8F8] font-medium">Sandboxed Validation Engine</div>
              <div className="text-xs text-[#8A8F98] leading-relaxed">Executes Python verification scripts deterministically without network access.</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}