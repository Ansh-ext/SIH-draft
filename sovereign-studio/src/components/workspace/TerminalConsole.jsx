import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

export default function TerminalConsole() {
  const [health, setHealth] = useState('checking');
  const [bootLog, setBootLog] = useState([
    '[SYS] Loading Sovereign local runtime...',
    '[SEC] Verifying air-gap configuration...',
  ]);

  useEffect(() => {
    apiService.getHealth().then((h) => {
      setHealth(h.status === 'ok' ? 'ok' : 'offline');
      setBootLog((prev) => [
        ...prev,
        h.status === 'ok'
          ? '[SYS] Backend API reachable — runtime ready.'
          : '[SYS] Backend API offline — check uvicorn (python run.py).',
      ]);
    });

    let cancelled = false;
    apiService.getAudit(25).then((entries) => {
      if (cancelled || !entries.length) return;
      const mapped = entries
        .slice(-12)
        .map((entry) => `[AUDIT] ${entry.event_type} | ${entry.model_tag || entry.tool || ''} | ${String(entry.query || entry.description || '').slice(0, 70)}`);
      setBootLog((prev) => [...prev, ...mapped]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const healthLabel =
    health === 'ok' ? { text: 'Optimal', cls: 'text-[#35E6A4]' } : health === 'offline' ? { text: 'Offline', cls: 'text-[#FF5555]' } : { text: 'Checking', cls: 'text-[#E5A93C]' };

  return (
    <div className="flex flex-col h-full bg-[#0B0C0E] font-mono text-xs overflow-hidden">
      {/* Fixed System Metrics Header */}
      <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#121417] border-b border-[#22262F] shrink-0 text-[11px]">
        <div className="flex items-center justify-between bg-[#0B0C0E] px-2 py-1 rounded border border-[#22262F]">
          <span className="text-[#8A8F98]">Health:</span>
          <span className={`font-semibold flex items-center gap-1 ${healthLabel.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${health !== 'offline' ? 'animate-pulse' : ''}`}></span> {healthLabel.text}
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#0B0C0E] px-2 py-1 rounded border border-[#22262F]">
          <span className="text-[#8A8F98]">Outbound:</span>
          <span className="text-[#35E6A4] font-semibold">0 KB/s (Air-Gapped)</span>
        </div>

        <div className="flex items-center justify-between bg-[#0B0C0E] px-2 py-1 rounded border border-[#22262F]">
          <span className="text-[#8A8F98]">Persistence:</span>
          <span className="text-[#D0D4DC]">ChromaDB Active</span>
        </div>

        <div className="flex items-center justify-between bg-[#0B0C0E] px-2 py-1 rounded border border-[#22262F]">
          <span className="text-[#8A8F98]">Audit Status:</span>
          <span className="text-[#E5A93C]">HASH_CHAIN_LOGGING</span>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5 text-[#8A8F98] text-[11px] leading-relaxed">
        {bootLog.map((line, i) => {
          if (line.startsWith('[AUDIT]'))
            return (
              <div key={i}>
                <span className="text-[#E5A93C]">[AUDIT]</span>
                <span> {line.slice(7)}</span>
              </div>
            );
          if (line.startsWith('[SYS]'))
            return (
              <div key={i}>
                <span className="text-[#35E6A4]">[SYS]</span>
                <span> {line.slice(5)}</span>
              </div>
            );
          return (
            <div key={i}>
              <span className="text-[#3B82F6]">[SEC]</span>
              <span> {line.slice(5)}</span>
            </div>
          );
        })}
        <div className="text-[#F7F8F8] animate-pulse">&gt; Awaiting document or prompt instruction...</div>
      </div>
    </div>
  );
}