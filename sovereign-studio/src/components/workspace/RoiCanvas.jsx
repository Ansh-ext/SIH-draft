import React, { useState, useEffect } from 'react';
import { useRoiSelector } from '../../hooks/useRoiSelector';

export default function RoiCanvas({ activeDoc, onSelectFile, onRoiCaptured }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const {
    roi,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetRoi,
  } = useRoiSelector();

  useEffect(() => {
    if (!activeDoc) {
      setSelectedImage(null);
      resetRoi();
      return;
    }

    if (typeof activeDoc === 'string') {
      setSelectedImage(activeDoc);
    } else if (activeDoc instanceof File) {
      const imageUrl = URL.createObjectURL(activeDoc);
      setSelectedImage(imageUrl);
      return () => URL.revokeObjectURL(imageUrl);
    } else if (activeDoc?.url) {
      setSelectedImage(activeDoc.url);
    } else {
      setSelectedImage('/sample-document-preview.png');
    }
  }, [activeDoc, resetRoi]);

  const handleMouseUpWithCallback = (e) => {
    handleMouseUp(e);
    if (roi && roi.width > 5 && roi.height > 5 && onRoiCaptured) {
      onRoiCaptured(roi);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onSelectFile) {
        onSelectFile(file);
      } else {
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        resetRoi();
      }
    }
  };

  if (!activeDoc && !selectedImage) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#0B0C0E]">
        <div className="border border-[#22262F] rounded-2xl p-8 max-w-md bg-[#121417]">
          <div className="w-10 h-10 bg-[#181B20] border border-[#22262F] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#35E6A4] font-mono text-xs">
            📄
          </div>
          <h3 className="text-xs font-semibold text-[#F7F8F8] mb-1">No Document Loaded</h3>
          <p className="text-[11px] text-[#8A8F98] mb-5 leading-relaxed">
            Select a file from the sidebar or upload a new scan to initiate target region selection.
          </p>
          <label className="inline-block px-4 py-2 bg-[#35E6A4] hover:bg-[#2FD193] text-[#0B0C0E] text-xs font-semibold rounded-lg transition-colors cursor-pointer">
            Browse Local File
            <input 
              type="file" 
              accept="image/*,.pdf" 
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0C0E] text-[#F7F8F8] overflow-hidden relative">
      {/* Canvas Header */}
      <div className="bg-[#121417] border-b border-[#22262F] px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="font-semibold text-[#35E6A4] uppercase">ROI OCR CANVAS</span>
          <span className="text-[#6E737D]">| Select Target Region</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-2.5 py-1 bg-[#181B20] hover:bg-[#22262F] text-[#D0D6E0] rounded text-[10px] cursor-pointer font-mono border border-[#22262F] transition-colors">
            Upload Doc/PDF
            <input 
              type="file" 
              accept="image/*,.pdf" 
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </label>

          {roi && (
            <button 
              onClick={resetRoi}
              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-mono transition-colors cursor-pointer"
            >
              Reset Region
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 p-3 flex items-center justify-center overflow-auto relative select-none bg-[#0B0C0E]">
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpWithCallback}
          className="relative cursor-crosshair max-w-full max-h-full border border-[#22262F] rounded-lg overflow-hidden shadow-2xl bg-[#121417]"
        >
          <img 
            src={selectedImage} 
            alt="Document Page" 
            className="max-h-[380px] w-auto object-contain pointer-events-none select-none opacity-90" 
          />

          {/* ROI Overlay */}
          {roi && roi.width > 0 && roi.height > 0 && (
            <div 
              style={{
                left: `${roi.x}px`,
                top: `${roi.y}px`,
                width: `${roi.width}px`,
                height: `${roi.height}px`,
              }}
              className="absolute border-2 border-[#35E6A4] bg-[#35E6A4]/15 pointer-events-none flex items-start justify-end p-1"
            >
              <span className="bg-[#35E6A4] text-[#0B0C0E] font-mono text-[9px] font-bold px-1 rounded">
                ROI: {Math.round(roi.width)}x{Math.round(roi.height)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#121417] border-t border-[#22262F] px-3 py-1 flex items-center justify-between text-[10px] font-mono text-[#8A8F98] shrink-0">
        <div>
          <span>Selected Target: </span>
          <span className="text-[#35E6A4] font-semibold">
            {roi && roi.width > 0 
              ? `X:${Math.round(roi.x)} Y:${Math.round(roi.y)} W:${Math.round(roi.width)} H:${Math.round(roi.height)}` 
              : 'None'}
          </span>
        </div>
        <div>
          <span>Target Model: </span>
          <span className="text-[#F7F8F8] font-semibold">Qwen3-VL (Local Vision)</span>
        </div>
      </div>
    </div>
  );
}