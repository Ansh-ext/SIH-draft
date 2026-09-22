import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { apiService } from '../../services/api';

export default function Deliverables({ onExportComplete }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await apiService.getDeliverables();
      if (active) setFiles(list);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  // Refresh fetches fresh data from the backend
  async function refresh() {
    setLoading(true);
    const list = await apiService.getDeliverables();
    setFiles(list);
    setLoading(false);
  }

  const handleDownload = (fileName) => {
    if (onExportComplete) onExportComplete();
    window.open(apiService.getDownloadUrl(fileName), '_blank');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0C0E] text-[#F7F8F8] overflow-hidden text-xs">
      <div className="px-3 py-2 border-b border-[#22262F] bg-[#121417] flex items-center justify-between shrink-0">
        <span className="font-mono font-medium text-[#8A8F98] uppercase text-[10px] tracking-wider">
          Generated Deliverables
        </span>
        <button
          onClick={refresh}
          className="px-2 py-0.5 rounded bg-[#35E6A4]/10 text-[#35E6A4] border border-[#35E6A4]/20 text-[9px] font-mono hover:bg-[#35E6A4]/20 transition-colors"
        >
          ↻ REFRESH
        </button>
      </div>

      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto min-h-0">
        {loading && <p className="text-[10px] text-[#6E737D] font-mono">Loading outputs...</p>}
        {!loading && files.length === 0 && (
          <p className="text-[10px] text-[#6E737D] font-mono">No deliverables generated yet. Ask the Codex assistant to create one.</p>
        )}
        {files.map((file, idx) => (
          <div
            key={idx}
            className="bg-[#121417] border border-[#22262F] hover:border-[#35E6A4]/50 p-2.5 rounded-lg flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="text-[#35E6A4] font-mono text-xs">📄</span>
              <div className="truncate">
                <p className="text-[#F7F8F8] font-medium truncate text-xs">{file.name}</p>
                <span className="text-[#6E737D] text-[10px] font-mono">{file.size}</span>
              </div>
            </div>

            <button
              onClick={() => handleDownload(file.name)}
              className="px-2.5 py-1 rounded bg-[#35E6A4] hover:bg-[#2FD193] text-[#0B0C0E] font-semibold text-[10px] font-mono transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}