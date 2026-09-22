import React, { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import logo from '../../assets/logo.jpeg';

export default function Navbar() {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className="bg-[#0B0C0E]/90 backdrop-blur-md border-b border-[#22262F] px-8 py-4 flex items-center justify-between sticky top-0 z-50 text-base font-medium"
      onMouseLeave={() => setActiveDropdown(null)}
    >
      {/* Brand Logo & Status */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-[#121417] border border-[#22262F] group-hover:border-[#35E6A4]/40 flex items-center justify-center overflow-hidden transition-colors shrink-0">
            <img 
              src={logo} 
              alt="Sovereign AI Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[#F7F8F8] font-bold tracking-tight text-lg">
            SOVEREIGN<span className="text-[#8A8F98]">.AI</span>
          </span>
        </Link>
        <span className="px-3 py-1 rounded text-xs font-mono font-medium bg-[#121417] text-[#35E6A4] border border-[#35E6A4]/20 hidden sm:inline-block">
          0 KB/S OUTBOUND
        </span>
      </div>

      {/* Center Navigation Links - Linear Capsule Style */}
      <div className="relative flex items-center gap-2 text-[#8A8F98]">
        
        {/* PRODUCT DROPDOWN */}
        <div 
          className="relative"
          onMouseEnter={() => setActiveDropdown('product')}
        >
          <button 
            className={`px-4 py-2 rounded-full transition-all text-base font-medium ${
              activeDropdown === 'product' || isActive('/workbench')
                ? 'bg-[#181B20] text-[#F7F8F8]'
                : 'hover:text-[#F7F8F8]'
            }`}
          >
            Product
          </button>

          {/* EXACT LINEAR STYLE MEGA MENU DROPDOWN */}
          {activeDropdown === 'product' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[900px] bg-[#121417] border border-[#22262F] rounded-2xl shadow-2xl p-8 text-left z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              
              <div className="grid grid-cols-12 gap-8">
                
                {/* Section 1: Extraction & Intake */}
                <div className="col-span-4 space-y-5 pr-2">
                  <Link 
                    to="/workbench?tab=document-intake" 
                    className="block group space-y-2 p-3 rounded-xl hover:bg-[#181B20] transition-colors"
                  >
                    <div className="text-base font-semibold text-[#F7F8F8] group-hover:text-[#35E6A4] transition-colors">
                      Document Intake
                    </div>
                    <p className="text-sm text-[#8A8F98] leading-normal font-normal">
                      Extract structured tables & bounding boxes from air-gapped PDFs.
                    </p>
                  </Link>

                  <Link 
                    to="/workbench?tab=roi-inspector" 
                    className="block group space-y-2 p-3 rounded-xl hover:bg-[#181B20] transition-colors"
                  >
                    <div className="text-base font-semibold text-[#F7F8F8] group-hover:text-[#35E6A4] transition-colors">
                      ROI Inspector
                    </div>
                    <p className="text-sm text-[#8A8F98] leading-normal font-normal">
                      Isolate exact spatial regions with local vision models.
                    </p>
                  </Link>
                </div>

                {/* Section 2: AI & Vector Processing */}
                <div className="col-span-4 space-y-5 border-l border-[#22262F] pl-6">
                  <Link 
                    to="/workbench?tab=local-rag" 
                    className="block group space-y-2 p-3 rounded-xl hover:bg-[#181B20] transition-colors"
                  >
                    <div className="text-base font-semibold text-[#F7F8F8] group-hover:text-[#35E6A4] transition-colors">
                      Local RAG Vectors
                    </div>
                    <p className="text-sm text-[#8A8F98] leading-normal font-normal">
                      Embeddings indexed locally inside ChromaDB with zero network calls.
                    </p>
                  </Link>

                  <Link 
                    to="/workbench?tab=wasm-sandbox" 
                    className="block group space-y-2 p-3 rounded-xl hover:bg-[#181B20] transition-colors"
                  >
                    <div className="text-base font-semibold text-[#F7F8F8] group-hover:text-[#35E6A4] transition-colors">
                      WASM Sandbox Engine
                    </div>
                    <p className="text-sm text-[#8A8F98] leading-normal font-normal">
                      Run Python scripts in browser to verify line item calculations.
                    </p>
                  </Link>
                </div>

                {/* Section 3: System Directory */}
                <div className="col-span-4 border-l border-[#22262F] pl-6 space-y-4 flex flex-col justify-start text-sm font-medium pt-2">
                  <span className="text-xs font-mono text-[#6E737D] uppercase tracking-wider mb-1 font-semibold">
                    Architecture
                  </span>
                  
                  <Link to="/about" className="text-[#8A8F98] hover:text-[#F7F8F8] transition-colors text-sm py-1">
                    Security Whitepaper
                  </Link>
                  <Link to="/pricing" className="text-[#8A8F98] hover:text-[#F7F8F8] transition-colors text-sm py-1">
                    Changelog & Benchmarks
                  </Link>
                  <Link to="/contact" className="text-[#8A8F98] hover:text-[#F7F8F8] transition-colors text-sm py-1">
                    Air-Gap Audit Report
                  </Link>
                  <Link to="/workbench" className="text-[#8A8F98] hover:text-[#F7F8F8] transition-colors text-sm py-1">
                    ONNX Runtime Config
                  </Link>
                </div>

              </div>

              {/* Bottom Announcement Strip */}
              <div className="mt-8 pt-5 border-t border-[#22262F] flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-[#35E6A4]/10 text-[#35E6A4] font-mono text-xs font-bold border border-[#35E6A4]/20">
                    NEW
                  </span>
                  <span className="text-[#F7F8F8] font-medium text-sm">Local Vision Engine v2.4 Released</span>
                </div>
                <Link to="/workbench" className="text-[#8A8F98] hover:text-[#35E6A4] transition-colors flex items-center gap-1.5 font-mono text-xs font-medium">
                  Explore Docs &rarr;
                </Link>
              </div>

            </div>
          )}
        </div>

        {/* STANDARD LINKS */}
        <Link 
          to="/" 
          className={`px-4 py-2 rounded-full transition-all text-base ${
            isActive('/') ? 'bg-[#181B20] text-[#F7F8F8]' : 'hover:text-[#F7F8F8]'
          }`}
        >
          Home
        </Link>

        <Link 
          to="/about" 
          className={`px-4 py-2 rounded-full transition-all text-base ${
            isActive('/about') ? 'bg-[#181B20] text-[#F7F8F8]' : 'hover:text-[#F7F8F8]'
          }`}
        >
          About
        </Link>

        <Link 
          to="/pricing" 
          className={`px-4 py-2 rounded-full transition-all text-base ${
            isActive('/pricing') ? 'bg-[#181B20] text-[#F7F8F8]' : 'hover:text-[#F7F8F8]'
          }`}
        >
          Pricing
        </Link>

        <Link 
          to="/workbench" 
          className={`px-4 py-2 rounded-full transition-all text-base ${
            isActive('/workbench') ? 'bg-[#181B20] text-[#F7F8F8]' : 'hover:text-[#F7F8F8]'
          }`}
        >
          Workbench
        </Link>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Link 
          to="/workbench"
          className="text-[#8A8F98] hover:text-[#F7F8F8] px-3 py-1.5 transition-colors text-base font-medium"
        >
          Log in
        </Link>
        <Link
          to="/workbench"
          className="px-5 py-2 text-base font-semibold rounded-full bg-[#F7F8F8] hover:bg-[#E1E4E6] text-[#0B0C0E] transition-all shadow-sm active:scale-95"
        >
          Launch Studio
        </Link>
      </div>
    </nav>
  );
}