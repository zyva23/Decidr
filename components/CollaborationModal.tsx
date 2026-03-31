import React, { useState } from 'react';
import { Contribution, DecisionSession } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: DecisionSession;
  onSynthesize: (selectedIds: string[], notify: boolean) => void;
  isSynthesizing: boolean;
}

const CollaborationModal: React.FC<Props> = ({ isOpen, onClose, session, onSynthesize, isSynthesizing }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notify, setNotify] = useState(true);

  if (!isOpen) return null;

  const contributions = session.contributions || [];

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Human Perspectives</h3>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Strategic Peer Review</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {contributions.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <p className="text-slate-400">No peer insights received yet.</p>
              <p className="text-slate-600 text-xs mt-2 italic">Share the deliberation link to invite expert commentary.</p>
            </div>
          ) : (
            contributions.map((c) => (
              <div 
                key={c.id} 
                onClick={() => toggleSelection(c.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                  selectedIds.includes(c.id) 
                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(c.id) ? 'bg-indigo-500 border-indigo-400' : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'}`}>
                      {selectedIds.includes(c.id) && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">{c.name}</span>
                      {c.status === 'accepted' && <span className="ml-2 text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">Incorporated</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600">{new Date(c.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed pl-8">{c.content}</p>
              </div>
            ))
          )}
        </div>

        {contributions.length > 0 && (
          <div className="p-8 border-t border-slate-800 bg-slate-900/50 rounded-b-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-300">Notify Contributors</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Mark as accepted in their view</span>
              </div>
              <button 
                onClick={() => setNotify(!notify)}
                className={`w-12 h-6 rounded-full transition-all relative ${notify ? 'bg-emerald-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notify ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <button
              onClick={() => onSynthesize(selectedIds, notify)}
              disabled={selectedIds.length === 0 || isSynthesizing}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${
                selectedIds.length === 0 || isSynthesizing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 active:scale-[0.99]'
              }`}
            >
              {isSynthesizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating Synthesis...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 18H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-5"/><path d="m15 13-3 3-3-3"/><path d="M12 16V2"/></svg>
                  Synthesize with {selectedIds.length} Peer Insights
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationModal;
