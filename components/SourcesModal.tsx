import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sources: string[];
  role: string;
}

const SourcesModal: React.FC<Props> = ({ isOpen, onClose, sources, role }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <h3 className="font-bold text-white">Research Sources ({role})</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {sources.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No external sources cited for this analysis.</p>
          ) : (
            <ul className="space-y-3">
              {sources.map((source, i) => (
                <li key={i} className="flex gap-3 items-start group">
                  <span className="text-slate-600 font-mono text-xs mt-1">{i + 1}.</span>
                  <a 
                    href={source.includes('http') ? source.split(': http')[1] || source : `https://www.bing.com/search?q=${encodeURIComponent(source)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all leading-relaxed transition-colors"
                  >
                    {source}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
            <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 uppercase font-bold tracking-wider">Close Window</button>
        </div>
      </div>
    </div>
  );
};

export default SourcesModal;