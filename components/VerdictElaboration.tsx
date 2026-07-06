import React from 'react';
import { CouncilResult } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VerdictElaborationProps {
  isOpen: boolean;
  onClose: () => void;
  result: CouncilResult;
}

const VerdictElaboration: React.FC<VerdictElaborationProps> = ({ isOpen, onClose, result }) => {
  if (!isOpen) return null;

  // Use Analyst chart data for the ROI projection as they are the financial expert
  const roiData = result.analyst.chartData || [];
  const roiLabel = result.analyst.chartLabel || "Projected Value";

  const agents = [
    { data: result.analyst, color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
    { data: result.strategist, color: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
    { data: result.skeptic, color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' },
    { data: result.mediator, color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Deep Strategic Elaboration</h2>
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 
                Multi-Dimensional Intelligence Breakdown
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          {/* Section 1: Financial Projection (ROI) */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-8 shadow-inner">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Quantitative Trajectory</h3>
                <p className="text-sm text-slate-400 font-medium">Modeling based on current market proxies and Analyst intelligence.</p>
              </div>
              <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] shadow-lg">
                {roiLabel}
              </div>
            </div>
            
            <div className="h-80 w-full bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50">
              {roiData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={roiData}>
                    <defs>
                      <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="label" stroke="#475569" tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis stroke="#475569" tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155' }}
                      itemStyle={{ color: '#818cf8', fontWeight: 'bold', fontSize: '12px' }}
                      formatter={(value: number) => [`${value}`, roiLabel]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRoi)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  <p className="text-xs font-black uppercase tracking-widest">Insufficient data for high-fidelity modeling.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Multi-Track Timeline */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-8 shadow-inner overflow-x-auto">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Council Milestone Sequence</h3>
              <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> Phase 1</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> Phase 2</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> Phase 3</span>
              </div>
            </div>
            
            <div className="relative min-w-[800px] space-y-12">
              {/* Timeline Header Labels */}
              <div className="flex justify-between px-12 pb-6 border-b border-slate-800/50 mb-4 ml-24 relative">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] absolute left-12 -bottom-px">Genesis</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Execution</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pivot Point</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] absolute right-12 -bottom-px">Horizon</span>
              </div>

              {agents.map((agent, agentIdx) => (
                <div key={agentIdx} className="relative z-10 group/row">
                  <div className="flex items-center mb-5 gap-4">
                    <div className={`w-2 h-2 rounded-full ${agent.color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                    <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${agent.text} w-24 flex-shrink-0`}>
                      {agent.data.role}
                    </span>
                    <div className="h-px bg-slate-800 flex-grow opacity-50 group-hover/row:opacity-100 transition-opacity"></div>
                  </div>
                  
                  <div className="flex justify-between items-start gap-6 px-4">
                    {agent.data.sequence && agent.data.sequence.length > 0 ? (
                        agent.data.sequence.slice(0, 4).map((event, idx) => (
                        <div key={idx} className="flex-1 min-w-0 group relative">
                            {/* Connecting Line */}
                            {idx < agent.data.sequence.length - 1 && (
                            <div className={`absolute top-2 left-[50%] right-[-50%] h-0.5 bg-slate-800/50`}></div>
                            )}
                            
                            <div className="flex flex-col items-center text-center relative z-10">
                            <div className={`w-4 h-4 rounded-full border-2 ${agent.border} ${agent.color} shadow-2xl mb-3 group-hover:scale-125 transition-transform duration-500`}></div>
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl w-full min-h-[80px] flex flex-col items-center justify-center hover:border-slate-600 hover:bg-slate-800 transition-all shadow-xl">
                                <span className={`text-[9px] font-black uppercase mb-1 tracking-wider ${agent.text}`}>{event.step}</span>
                                <span className="text-[11px] text-slate-400 leading-snug font-medium italic">"{event.detail}"</span>
                            </div>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="flex-1 py-8 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 italic">No specific sequence projection.</span>
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-center sticky bottom-0 z-10">
           <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] italic">
              Strategic Deep Dive Deliberation
           </p>
        </div>
      </div>
    </div>
  );
};

export default VerdictElaboration;
