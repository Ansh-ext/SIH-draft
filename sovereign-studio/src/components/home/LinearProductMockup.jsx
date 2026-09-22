import React from 'react';

export default function LinearProductMockup() {
  return (
    <section className="bg-[#0B0C0E] py-24 px-6 border-t border-[#22262F]">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <h2 className="md:col-span-6 text-3xl md:text-5xl font-bold text-[#F7F8F8] tracking-tight leading-tight">
            Local document workbench. <br />
            <span className="text-[#8A8F98]">From raw PDF to structured JSON.</span>
          </h2>
          <div className="md:col-span-6 space-y-4">
            <p className="text-[#8A8F98] text-base md:text-lg font-normal leading-relaxed">
              Upload invoices, technical papers, or handwritten forms. Sovereign AI isolates document regions, validates line-item math via local code execution, and streams structured outputs.
            </p>
          </div>
        </div>

        {/* Real Product Interface Frame */}
        <div className="relative rounded-xl border border-[#22262F] bg-[#121417] p-4 md:p-6 shadow-2xl overflow-hidden">
          
          {/* Top Window Bar */}
          <div className="flex items-center justify-between border-b border-[#22262F] pb-4 mb-6 text-xs font-mono text-[#6E737D]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#22262F]"></span>
              <span className="w-3 h-3 rounded-full bg-[#22262F]"></span>
              <span className="w-3 h-3 rounded-full bg-[#22262F]"></span>
              <span className="ml-2 text-[#8A8F98]">sovereign-workbench://session-0491.pdf</span>
            </div>
            <div className="flex items-center gap-2 text-[#35E6A4]">
              <span className="w-2 h-2 rounded-full bg-[#35E6A4] animate-pulse"></span>
              <span>0 KB Outbound (Air-Gapped)</span>
            </div>
          </div>

          {/* Grid Layout of the Workbench */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Bounding Box Inspector */}
            <div className="md:col-span-5 bg-[#0B0C0E] border border-[#22262F] rounded-lg p-4 font-mono text-xs space-y-3">
              <div className="text-[#8A8F98] border-b border-[#22262F] pb-2 flex justify-between">
                <span>DETECTED_ROI_BOUNDS</span>
                <span className="text-[#35E6A4]">CONFIDENCE 99.4%</span>
              </div>
              
              <div className="bg-[#121417] p-3 rounded border border-[#22262F] text-[#8A8F98] space-y-1.5">
                <div className="text-[#F7F8F8] font-bold">Region #01: [Invoice Total]</div>
                <div>Bounding Box: <span className="text-[#F7F8F8]">[x: 142, y: 520, w: 180, h: 45]</span></div>
                <div>Extracted Value: <span className="text-[#35E6A4] font-bold">$124,500.00</span></div>
              </div>

              <div className="bg-[#121417] p-3 rounded border border-[#22262F] text-[#8A8F98] space-y-1.5">
                <div className="text-[#F7F8F8] font-bold">Region #02: [Tax Breakdown]</div>
                <div>Bounding Box: <span className="text-[#F7F8F8]">[x: 142, y: 580, w: 180, h: 30]</span></div>
                <div>Extracted Value: <span className="text-[#F7F8F8] font-bold">18.0% GST ($22,410.00)</span></div>
              </div>
            </div>

            {/* Right Column: Local Execution & JSON Schema */}
            <div className="md:col-span-7 bg-[#0B0C0E] border border-[#22262F] rounded-lg p-4 font-mono text-xs space-y-3">
              <div className="text-[#8A8F98] border-b border-[#22262F] pb-2 flex justify-between">
                <span>SANDBOX_OUTPUT.json</span>
                <span className="text-[#6E737D]">Pyodide WASM Runtime</span>
              </div>

              <pre className="text-[#8A8F98] leading-relaxed overflow-x-auto p-2 bg-[#121417] rounded border border-[#22262F]">
{`{
  "document_type": "Tax_Invoice",
  "data_sovereignty": "Verified_Local",
  "extracted_payload": {
    "subtotal": 102090.00,
    "tax_amount": 22410.00,
    "calculated_total": 124500.00,
    "math_check_passed": true
  },
  "vector_indexed": true
}`}
              </pre>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}