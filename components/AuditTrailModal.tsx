import React, { useState } from 'react';
import { CouncilSnapshot, CouncilResult } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: CouncilResult;
}

const AuditTrailModal: React.FC<Props> = ({ isOpen, onClose, result }) => {
  const snapshots = result.history || [];
  // Include the current (active) state as the final "snapshot"
  const allVersions: CouncilSnapshot[] = [
    ...snapshots,
    {
      timestamp: Date.now(), // Placeholder for current
      input: {} as any, // Not strictly needed for diffing text
      analyst: result.analyst,
      strategist: result.strategist,
      skeptic: result.skeptic,
      mediator: result.mediator,
      synthesis: result.synthesis,
      causalSummary: result.synthesis.changeLog
    }
  ];

  const [v1Idx, setV1Idx] = useState(Math.max(0, allVersions.length - 2));
  const [v2Idx, setV2Idx] = useState(allVersions.length - 1);

  if (!isOpen) return null;

  const v1 = allVersions[v1Idx];
  const v2 = allVersions[v2Idx];

  const renderDiff = (oldText: string = "", newText: string = "") => {
    if (oldText === newText) return <span className="text-slate-400">{newText}</span>;
    
    // Simple word-based diff logic
    const oldWords = oldText.split(' ');
    const newWords = newText.split(' ');
    
    // This is a naive diff for UI display
    // In a real app, we'd use a lib like 'diff'
    return (
      <div className="flex flex-wrap gap-x-1 leading-relaxed">
        {newWords.map((word, i) => {
           const isNew = !oldWords.includes(word);
           return (
             <span key={i} className={isNew ? 'text-emerald-400 bg-emerald-500/10 px-0.5 rounded underline decoration-emerald-500/30' : 'text-slate-300'}>
               {word}
             </span>
           );
        })}
        {oldWords.filter(w => !newWords.includes(w)).map((word, i) => (
           <span key={`del-${i}`} className="text-red-400/50 line-through decoration-red-500/50">
             {word}
           </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Audit Timeline</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Deliberation Evolution & Causal Reasoning</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <select 
                  value={v1Idx} 
                  onChange={(e) => setV1Idx(parseInt(e.target.value))}
                  className="bg-transparent text-[10px] font-bold text-slate-400 p-2 outline-none"
                >
                  {allVersions.map((_, i) => <option key={i} value={i}>Version {i + 1}</option>)}
                </select>
                <span className="text-slate-700">/</span>
                <select 
                  value={v2Idx} 
                  onChange={(e) => setV2Idx(parseInt(e.target.value))}
                  className="bg-transparent text-[10px] font-bold text-indigo-400 p-2 outline-none"
                >
                  {allVersions.map((_, i) => <option key={i} value={i}>Version {i + 1}</option>)}
                </select>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          
          {/* Causal Reasoning Layer */}
          <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
             </div>
             <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs shadow-lg">🧠</div>
                   <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Causal Reasoning Layer</h3>
                </div>
                <p className="text-lg text-slate-200 font-medium leading-relaxed italic border-l-2 border-indigo-500/30 pl-6">
                   {v2.causalSummary || "The Council evolved its stance based on iterative refinements to the strategic context."}
                </p>
             </div>
          </div>

          {/* Granular Report Diffs */}
          <div className="space-y-8">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Granular Intelligence Diffs</span>
                <div className="h-px flex-1 bg-slate-800"></div>
             </div>

             <div className="grid grid-cols-1 gap-6">
                {/* Master Verdict Diff */}
                <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-6 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Master Verdict Evolution</span>
                      <span className="text-[9px] text-slate-600 font-bold">V{v1Idx+1} → V{v2Idx+1}</span>
                   </div>
                   <div className="text-sm">
                      {renderDiff(v1.synthesis.recommendation, v2.synthesis.recommendation)}
                   </div>
                </div>

                {/* Agent Diffs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[
                     { name: 'Analyst', v1: v1.analyst, v2: v2.analyst, color: 'text-blue-400' },
                     { name: 'Strategist', v1: v1.strategist, v2: v2.strategist, color: 'text-purple-400' },
                     { name: 'Skeptic', v1: v1.skeptic, v2: v2.skeptic, color: 'text-red-400' },
                     { name: 'Mediator', v1: v1.mediator, v2: v2.mediator, color: 'text-emerald-400' }
                   ].map(agent => (
                     <div key={agent.name} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${agent.color}`}>{agent.name} Report</span>
                           <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold ${agent.v2.score >= agent.v1.score ? 'text-emerald-400' : 'text-red-400'}`}>
                                 {agent.v1.score} → {agent.v2.score}
                              </span>
                           </div>
                        </div>
                        <div className="text-xs leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                           {renderDiff(agent.v1.analysis, agent.v2.analysis)}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Footer & Pagination */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex flex-col items-center gap-6 sticky bottom-0 z-10">
           <div className="flex items-center gap-4 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3 mr-2">Compare Evolution</span>

              <div className="flex items-center gap-1">
                <select 
                  value={v1Idx} 
                  onChange={(e) => setV1Idx(parseInt(e.target.value))}
                  className="bg-slate-900 text-xs font-bold text-slate-300 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {allVersions.map((_, i) => <option key={i} value={i}>Baseline: Version {i + 1}</option>)}
                </select>
                <div className="w-4 h-px bg-slate-800"></div>
                <select 
                  value={v2Idx} 
                  onChange={(e) => setV2Idx(parseInt(e.target.value))}
                  className="bg-slate-900 text-xs font-bold text-indigo-400 px-3 py-2 rounded-xl border border-indigo-500/30 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-900/10"
                >
                  {allVersions.map((_, i) => <option key={i} value={i}>Comparison: Version {i + 1}</option>)}
                </select>
              </div>
           </div>

           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">
              "Understanding why a decision changed is more valuable than the decision itself."
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailModal;
