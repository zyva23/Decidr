import React from 'react';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: { title: string; uri: string }[];
  role: string;
}

const SourcesModal: React.FC<SourcesModalProps> = ({ isOpen, onClose, sources, role }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 lg:p-12">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{role} Sources</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Grounding Intelligence & Citations</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-slate-950/30">
          {sources.length > 0 ? sources.map((source, i) => (
            <a 
              key={i} 
              href={source.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-indigo-500/50 transition-all group"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate mb-1">{source.title || 'Source intelligence'}</div>
                <div className="text-[10px] text-slate-500 truncate font-mono opacity-60">{source.uri}</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          )) : (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-500 italic">No specific external sources identified for this deliberation round.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">Verified Strategic Grounding</p>
        </div>
      </div>
    </div>
  );
};

export default SourcesModal;
