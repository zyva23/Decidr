import React, { useState, useEffect, useRef } from 'react';

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
}

const ResizableSplitPane: React.FC<Props> = ({ left, right }) => {
  const [leftWidth, setLeftWidth] = useState(30); // Default 30%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Clamp width between 20% and 50%
      if (newWidth >= 20 && newWidth <= 50) {
        setLeftWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row w-full gap-8 lg:gap-0 h-full overflow-hidden">
      {/* Left Pane Wrapper */}
      <div 
        className="shrink-0 w-full h-full flex flex-col min-h-0"
        style={{ width: isDesktop ? `${leftWidth}%` : '100%' }}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 lg:pr-3">
          {left}
        </div>
      </div>

      {/* Drag Handle (Desktop Only) */}
      <div 
        className="hidden lg:flex w-6 cursor-col-resize items-stretch justify-center group -ml-3 mr-3 z-10 hover:scale-110 transition-transform flex-shrink-0"
        onMouseDown={startDragging}
      >
        <div className={`w-1 h-24 my-auto rounded-full transition-all duration-300 ${
          isDragging 
            ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] h-32' 
            : 'bg-slate-800 group-hover:bg-indigo-500/50'
        }`} />
      </div>

      {/* Right Pane Wrapper */}
      <div className="flex-1 min-w-0 h-full flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar pl-1">
          {right}
        </div>
      </div>
    </div>
  );
};

export default ResizableSplitPane;