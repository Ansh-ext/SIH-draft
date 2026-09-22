import React from 'react';

export default function LinearQuotes() {
  return (
    <section className="bg-[#0B0C0E] py-20 px-6 border-t border-[#22262F]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Security Lead Quote */}
        <div className="md:col-span-8 bg-[#121417] border border-[#22262F] text-[#F7F8F8] p-8 md:p-12 rounded-xl flex flex-col justify-between h-[320px]">
          <p className="text-xl md:text-2xl font-medium tracking-tight leading-relaxed text-[#F7F8F8]">
            “Sovereign AI allowed our legal team to parse thousands of strict non-disclosure contracts without sending any unencrypted text to external cloud APIs.”
          </p>
          
          <div className="flex items-center gap-3 pt-6 border-t border-[#22262F]">
            <div className="w-8 h-8 rounded-full bg-[#181B20] border border-[#22262F] flex items-center justify-center text-xs font-mono text-[#35E6A4] font-bold">
              SAI
            </div>
            <div>
              <div className="font-semibold text-sm text-[#F7F8F8]">Enterprise Compliance Lead</div>
              <div className="text-xs text-[#8A8F98]">Air-Gapped Financial Sector</div>
            </div>
          </div>
        </div>

        {/* Performance Metric Quote */}
        <div className="md:col-span-4 bg-[#181B20] border border-[#35E6A4]/30 text-[#F7F8F8] p-8 md:p-12 rounded-xl flex flex-col justify-between h-[320px]">
          <p className="text-lg md:text-xl font-medium tracking-tight leading-snug">
            “Sub-second vector lookup and zero network bandwidth costs for internal document processing.”
          </p>

          <div className="flex items-center gap-3 pt-6 border-t border-[#22262F]">
            <span className="w-2 h-2 rounded-full bg-[#35E6A4] shadow-[0_0_8px_#35E6A4]"></span>
            <div>
              <div className="font-semibold text-sm text-[#F7F8F8]">Local RAG Metric</div>
              <div className="text-xs text-[#8A8F98]">ChromaDB + ONNX Engine</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}