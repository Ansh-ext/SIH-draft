import React from 'react';

export default function AuditFooter() {
  return (
    <div className="bg-[#121417] border-t border-[#22262F] px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-[#8A8F98]">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#35E6A4]" />
          System Health: <strong className="text-[#F7F8F8] font-medium">Optimal</strong>
        </span>
        <span className="text-[#22262F]">|</span>
        <span>
          Outbound Status: <strong className="text-[#35E6A4] font-medium">0 KB/s (Air-Gapped)</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span>Local Persistence: SQLite Active</span>
        <span className="text-[#22262F]">|</span>
        <span className="text-[#35E6A4]">Audit Status: LOGGING_ENABLED</span>
      </div>
    </div>
  );
}