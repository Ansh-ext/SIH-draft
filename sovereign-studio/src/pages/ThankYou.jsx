import React from 'react';
import { Link } from 'react-router-dom';
import MetaSEO from '../components/layout/MetaSEO';

export default function ThankYou() {
  return (
    <>
      <MetaSEO 
        title="Inquiry Received - Sovereign AI" 
        description="Your deployment inquiry has been logged."
      />

      <div className="flex-1 flex items-center justify-center bg-[#0B0C0E] text-[#F7F8F8] px-6 py-24">
        <div className="max-w-md w-full bg-[#121417]/80 border border-[#22262F] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-[#35E6A4]/10 border border-[#35E6A4]/20 flex items-center justify-center text-[#35E6A4] text-lg font-bold mx-auto mb-6">
            ✓
          </div>

          <h1 className="text-2xl font-semibold text-[#F7F8F8] tracking-tight mb-2">Inquiry Logged</h1>
          <p className="text-[#8A8F98] text-xs leading-relaxed mb-6">
            Your support request has been cryptographically recorded in our local registry queue. Our engineering team will review your deployment requirements.
          </p>

          <div className="bg-[#0B0C0E] border border-[#22262F] p-3 rounded-lg text-[11px] font-mono text-[#8A8F98] mb-6">
            Status: <span className="text-[#35E6A4]">QUEUED_LOCAL</span>
          </div>

          <Link
            to="/workbench"
            className="inline-block w-full py-2.5 bg-[#F7F8F8] hover:bg-[#E1E4E6] text-[#0B0C0E] font-medium rounded-lg transition-colors text-xs"
          >
            Return to Studio Workbench
          </Link>
        </div>
      </div>
    </>
  );
}