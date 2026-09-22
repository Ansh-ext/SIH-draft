import { useState, useRef } from 'react';

export function useRoiSelector() {
  const [roi, setRoi] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setIsSelecting(true);
    setRoi({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isSelecting || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startPos.x;
    const height = currentY - startPos.y;

    setRoi({
      x: width < 0 ? currentX : startPos.x,
      y: height < 0 ? currentY : startPos.y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  return {
    roi,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetRoi: () => setRoi(null)
  };
}