import React from 'react';
import MetaSEO from '../components/layout/MetaSEO';

export default function Terms() {
  return (
    <>
      <MetaSEO title="Terms of Service - Sovereign AI" description="Terms of service and local execution compliance." />
      <div className="min-h-screen bg-[#0B0C0E] text-[#F7F8F8] pt-20 pb-28 px-6 font-sans">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="border-b border-[#22262F] pb-8">
            <span className="text-[11px] font-mono text-[#35E6A4] uppercase tracking-wider block mb-2">
              Legal & Compliance
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-[#F7F8F8]">
              Terms of Service
            </h1>
            <p className="text-[#8A8F98] text-xs mt-3 font-mono">Last updated: September 2026</p>
          </div>

          <div className="space-y-8 text-xs leading-relaxed text-[#8A8F98]">
            <p className="text-[#D0D6E0] text-sm leading-relaxed">
              Welcome to Sovereign AI. By accessing or using our air-gapped processing environment, you agree to comply with and be bound by these Terms of Service.
            </p>

            <div className="bg-[#121417] border border-[#22262F] rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-[#F7F8F8]">1. Local & On-Premise Execution</h2>
              <p className="text-[#8A8F98]">
                All data ingestion, OCR parsing, and execution occur strictly on local infrastructure. You are responsible for maintaining hardware compliance and security protocols on your local node.
              </p>
            </div>

            <div className="bg-[#121417] border border-[#22262F] rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-[#F7F8F8]">2. Usage Restrictions</h2>
              <p className="text-[#8A8F98]">
                Unauthorized modification of the local pipeline sandboxes or execution engines beyond designed workflows is strictly prohibited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}