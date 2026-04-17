import React, { useState, useEffect, useRef } from 'react';

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  isResultReady?: boolean;
}

const ResizableSplitPane: React.FC<Props> = ({ left, right, isResultReady }) => {
  const [leftWidth, setLeftWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastWidth, setLastWidth] = useState(30);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Auto-switch to output tab on mobile when result is ready
  useEffect(() => {
    if (!isDesktop && isResultReady) {
      setActiveTab('output');
    }
  }, [isResultReady, isDesktop]);

  const startDragging = (e: React.MouseEvent) => {
    if (isCollapsed) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const toggleCollapse = () => {
    if (isCollapsed) {
      setLeftWidth(lastWidth);
    } else {
      setLastWidth(leftWidth);
      setLeftWidth(0);
    }
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || isCollapsed) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth >= 15 && newWidth <= 50) setLeftWidth(newWidth);
    };
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, isCollapsed]);

  if (!isDesktop) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Mobile Tab Switcher */}
        <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-xl mb-4 shrink-0 mx-1">
          <button 
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'input' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            The Inquiry
          </button>
          <button 
            onClick={() => setActiveTab('output')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all relative ${activeTab === 'output' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            The Council
            {isResultReady && activeTab !== 'output' && (
              <span className="absolute top-1.5 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse border border-slate-900"></span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className={`absolute inset-0 transition-transform duration-300 ${activeTab === 'input' ? 'translate-x-0' : '-translate-x-full'}`}>
             <div className="h-full overflow-y-auto custom-scrollbar px-1">
                {left}
             </div>
          </div>
          <div className={`absolute inset-0 transition-transform duration-300 ${activeTab === 'output' ? 'translate-x-0' : 'translate-x-full'}`}>
             <div className="h-full overflow-y-auto custom-scrollbar px-1">
                {right}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-row w-full h-full overflow-hidden relative">
      {/* Left Panel */}
      <div 
        className={`shrink-0 h-full flex flex-col min-h-0 transition-[width] duration-300 ease-in-out ${isCollapsed ? 'w-0 overflow-hidden' : ''}`} 
        style={{ width: isCollapsed ? '0px' : `${leftWidth}%` }}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3">
          {left}
        </div>
      </div>

      {/* Resizer & Collapse Toggle */}
      <div className="flex items-center relative z-20">
        <div 
            className={`flex w-6 h-full ${isCollapsed ? 'cursor-default' : 'cursor-col-resize'} items-center justify-center group -ml-3 mr-3`}
            onMouseDown={startDragging}
        >
            <div className={`w-1 h-24 rounded-full transition-all duration-300 ${isDragging ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] h-32' : 'bg-slate-800 group-hover:bg-indigo-500/50'}`} />
            
            {/* Collapse Button */}
            <button
                onClick={toggleCollapse}
                className="absolute top-1/2 -translate-y-1/2 left-0 w-6 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all shadow-xl group-hover:scale-110"
                title={isCollapsed ? "Expand Inquiry" : "Collapse Inquiry"}
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" height="14" 
                    viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" strokeWidth="3" 
                    strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
                >
                    <path d="m9 18 6-6-6-6"/>
                </svg>
            </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 min-w-0 h-full flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {right}
        </div>
      </div>
    </div>
  );
};

export default ResizableSplitPane;
