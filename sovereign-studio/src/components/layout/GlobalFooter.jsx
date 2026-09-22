import React from 'react';
import { Link } from 'react-router-dom';
// Ensure the path matches where your logo file is located in your assets directory
import sovereignLogo from '../../assets/logo.jpeg'; // ya logo.png / logo.webp

export default function GlobalFooter() {
  return (
    <footer className="bg-[#0B0C0E] border-t border-[#22262F] text-[#8A8F98] text-xs py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Description & Asset Logo */}
        <div className="space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-6 h-6 rounded bg-[#121417] border border-[#22262F] group-hover:border-[#35E6A4]/50 flex items-center justify-center p-0.5 transition-colors overflow-hidden shrink-0">
              <img 
                src={sovereignLogo} 
                alt="Sovereign AI Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[#F7F8F8] font-semibold text-sm tracking-tight">
              SOVEREIGN<span className="text-[#8A8F98]">.AI</span>
            </span>
          </Link>
          <p className="text-[#6E737D] leading-relaxed">
            100% Offline, Air-Gapped Local AI Workbench for enterprise documents, compliance verification, and automated reporting.
          </p>
        </div>

        {/* Quick Navigation */}
        <div>
          <h4 className="text-[#F7F8F8] font-medium text-xs mb-3">Quick Navigation</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-[#F7F8F8] transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-[#F7F8F8] transition-colors">About System</Link></li>
            <li><Link to="/pricing" className="hover:text-[#F7F8F8] transition-colors">Pricing</Link></li>
            <li><Link to="/workbench" className="hover:text-[#F7F8F8] transition-colors">AI Workbench</Link></li>
            <li><Link to="/contact" className="hover:text-[#F7F8F8] transition-colors">Contact Support</Link></li>
          </ul>
        </div>

        {/* Legal & Security */}
        <div>
          <h4 className="text-[#F7F8F8] font-medium text-xs mb-3">Legal & Security</h4>
          <ul className="space-y-2">
            <li><Link to="/privacy" className="hover:text-[#F7F8F8] transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-[#F7F8F8] transition-colors">Terms of Service</Link></li>
            <li className="pt-1">
              <span className="text-[#35E6A4] font-mono text-[11px] bg-[#35E6A4]/10 border border-[#35E6A4]/20 px-2 py-0.5 rounded">
                Air-Gap Standard Compliant
              </span>
            </li>
          </ul>
        </div>

        {/* System Identity */}
        <div>
          <h4 className="text-[#F7F8F8] font-medium text-xs mb-3">System Identity</h4>
          <div className="space-y-1.5 font-mono text-[11px]">
            <p className="text-[#6E737D]">
              Local Enforcement Node: <span className="text-[#F7F8F8]">v2.4.0-offline</span>
            </p>
            <p className="text-[#6E737D]">
              Network: <span className="text-[#35E6A4]">Isolated (0 KB/s Outbound)</span>
            </p>
          </div>
        </div>

      </div>

      {/* Copyright Line */}
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[#22262F] flex flex-col sm:flex-row items-center justify-between text-[#6E737D] text-[11px]">
        <div>
          © {new Date().getFullYear()} Sovereign AI. All rights reserved.
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#35E6A4]"></span>
          <span>Fully Air-Gapped Engine</span>
        </div>
      </div>
    </footer>
  );
}