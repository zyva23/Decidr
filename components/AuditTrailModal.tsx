import React, { useState } from 'react';
import { CouncilSnapshot, CouncilResult } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: CouncilResult;
}

const AuditTrailModal: React.FC<Props> = ({ isOpen, onClose, result }) => {
  const snapshots = result.history || [];
  // Include current active state
  const allVersions: CouncilSnapshot[] = [
    ...snapshots,
    {
      timestamp: Date.now(),
      input: result.history?.[result.history.length-1]?.input || {} as any, // Not strictly used for diffing
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
    const oldWords = oldText.split(' ');
    const newWords = newText.split(' ');
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

  const getInputDelta = (oldIn: any, newIn: any) => {
    const changes: string[] = [];
    if (oldIn.context !== newIn.context) changes.push("Context Refined");
    if (oldIn.constraints !== newIn.constraints) changes.push("Constraints Modified");
    if (oldIn.options !== newIn.options) changes.push("Options Shifted");
    return changes.length > 0 ? changes.join(", ") : "No direct input change detected.";
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 lg:p-12">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Audit Timeline</h2>
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 
                Intelligence Evolution & Causal Reasoning
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          
          {/* Causal Reasoning Layer */}
          <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-[2rem] p-10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
             </div>
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-lg shadow-xl">🧠</div>
                   <div>
                       <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em]">The Causal reasoning Layer</h3>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                           Delta: {v2.input && v1.input ? getInputDelta(v1.input, v2.input) : "Historical Evolution"}
                       </p>
                   </div>
                </div>
                <p className="text-xl text-slate-200 font-medium leading-relaxed italic border-l-4 border-indigo-500/30 pl-8">
                   {v2.causalSummary || "The Council refined its verdict based on an iterative deepening of the strategic context and new intelligence grounding."}
                </p>
             </div>
          </div>

          {/* Granular Report Diffs */}
          <div className="space-y-10">
             <div className="flex items-center gap-6">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Intelligence Delta Analysis</span>
                <div className="h-px flex-1 bg-slate-800"></div>
             </div>

             <div className="grid grid-cols-1 gap-8">
                {/* Master Verdict Evolution */}
                <div className="bg-slate-950/40 border border-slate-800/50 rounded-3xl p-8 space-y-6 shadow-inner">
                   <div className="flex justify-between items-center border-b border-slate-800/50 pb-4">
                      <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          Master Verdict Evolution
                      </span>
                      <span className="text-[10px] font-black text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">V{v1Idx+1} → V{v2Idx+1}</span>
                   </div>
                   <div className="text-base">
                      {renderDiff(v1.synthesis.recommendation, v2.synthesis.recommendation)}
                   </div>
                </div>

                {/* Agent Diffs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {[
                     { name: 'Analyst', v1: v1.analyst, v2: v2.analyst, color: 'text-blue-400', role: 'The Rationalist' },
                     { name: 'Strategist', v1: v1.strategist, v2: v2.strategist, color: 'text-purple-400', role: 'The Architect' },
                     { name: 'Skeptic', v1: v1.skeptic, v2: v2.skeptic, color: 'text-red-400', role: 'The Realist' },
                     { name: 'Mediator', v1: v1.mediator, v2: v2.mediator, color: 'text-emerald-400', role: 'The Ethicist' }
                   ].map(agent => (
                     <div key={agent.name} className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-8 space-y-4 hover:border-slate-700 transition-colors group/card shadow-xl">
                        <div className="flex justify-between items-center border-b border-slate-800/50 pb-4">
                           <div>
                               <span className={`text-xs font-black uppercase tracking-widest ${agent.color}`}>{agent.name} Report</span>
                               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{agent.role}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className={`text-xs font-black px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 ${agent.v2.score >= agent.v1.score ? 'text-emerald-400' : 'text-red-400'}`}>
                                 {agent.v1.score} → {agent.v2.score}
                              </span>
                           </div>
                        </div>
                        <div className="text-sm leading-relaxed max-h-60 overflow-y-auto pr-4 custom-scrollbar group-hover/card:text-slate-200 transition-colors">
                           {renderDiff(agent.v1.analysis, agent.v2.analysis)}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Footer & Navigation Pagination */}
        <div className="p-8 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col items-center gap-8 sticky bottom-0 z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
           <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-2xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4 mr-2">Temporal Pivot Navigation</span>
              
              <div className="flex items-center gap-2">
                <div className="relative group/sel">
                    <select 
                    value={v1Idx} 
                    onChange={(e) => setV1Idx(parseInt(e.target.value))}
                    className="appearance-none bg-slate-900 text-xs font-black text-slate-300 pl-4 pr-10 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer hover:bg-slate-800"
                    >
                    {allVersions.map((_, i) => <option key={i} value={i}>Baseline: Version {i + 1}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>

                <div className="w-8 h-px bg-slate-800"></div>

                <div className="relative group/sel">
                    <select 
                    value={v2Idx} 
                    onChange={(e) => setV2Idx(parseInt(e.target.value))}
                    className="appearance-none bg-indigo-600/10 text-xs font-black text-indigo-400 pl-4 pr-10 py-3 rounded-xl border border-indigo-500/30 outline-none focus:border-indigo-500 transition-all cursor-pointer hover:bg-indigo-600/20 shadow-lg shadow-indigo-900/10"
                    >
                    {allVersions.map((_, i) => <option key={i} value={i}>Comparison: Version {i + 1}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
              </div>
           </div>

           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em] italic opacity-50">
              Validated Strategic Audit Trail
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailModal;
