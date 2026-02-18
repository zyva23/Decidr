import React from 'react';
import { CouncilResult } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VerdictElaborationProps {
  result: CouncilResult;
}

const VerdictElaboration: React.FC<VerdictElaborationProps> = ({ result }) => {
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
    <div className="space-y-8 animate-fade-in">
      
      {/* Section 1: Financial Projection (ROI) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Financial & ROI Projection</h3>
            <p className="text-sm text-slate-400">Based on Analyst quantitative modeling.</p>
          </div>
          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs font-bold text-blue-400 uppercase tracking-wider">
            {roiLabel}
          </div>
        </div>
        
        <div className="h-64 w-full bg-slate-800/20 rounded-lg p-2 border border-slate-800/50">
          {roiData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roiData}>
                <defs>
                  <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value: number) => [`${value}`, roiLabel]}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRoi)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Insufficient data for financial visualization.
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Multi-Track Timeline */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Consolidated Council Timeline</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> Immediate</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> Mid-Term</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> Long-Term</span>
          </div>
        </div>
        
        <div className="relative min-w-[700px] space-y-8">
          {/* Timeline Header Labels */}
          <div className="flex justify-between px-12 pb-4 border-b border-slate-800/50 mb-2 ml-24 relative">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter absolute left-12 -bottom-px">Day 0</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Q1 Milestone</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Q2 Mid-Point</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter absolute right-12 -bottom-px">Long-Term View</span>
          </div>

          {/* Vertical Grid Lines (Cosmetic) */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-12">
            <div className="w-px h-full bg-slate-800/50 dashed"></div>
            <div className="w-px h-full bg-slate-800/50 dashed"></div>
            <div className="w-px h-full bg-slate-800/50 dashed"></div>
            <div className="w-px h-full bg-slate-800/50 dashed"></div>
          </div>

          {agents.map((agent, agentIdx) => (
            <div key={agentIdx} className="relative z-10">
              <div className="flex items-center mb-3 gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${agent.text} w-24 flex-shrink-0`}>
                  {agent.data.name}
                </span>
                <div className="h-px bg-slate-800 flex-grow"></div>
              </div>
              
              <div className="flex justify-between items-start gap-4 px-2">
                {agent.data.sequence && agent.data.sequence.length > 0 ? (
                    agent.data.sequence.slice(0, 4).map((event, idx) => (
                    <div key={idx} className="flex-1 min-w-0 group relative">
                        {/* Connecting Line */}
                        {idx < agent.data.sequence.length - 1 && (
                        <div className={`absolute top-1.5 left-[50%] right-[-50%] h-0.5 bg-slate-800 group-last:hidden`}></div>
                        )}
                        
                        <div className="flex flex-col items-center text-center">
                        <div className={`w-3 h-3 rounded-full border-2 ${agent.border} ${agent.color} z-10 shadow-[0_0_8px_rgba(0,0,0,0.5)] mb-2 group-hover:scale-125 transition-transform`}></div>
                        <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg w-full min-h-[60px] flex flex-col items-center justify-center hover:border-slate-500 transition-colors">
                            <span className={`text-[10px] font-bold uppercase mb-1 ${agent.text}`}>{event.step}</span>
                            <span className="text-[10px] text-slate-300 leading-tight line-clamp-2">{event.detail}</span>
                        </div>
                        </div>
                    </div>
                    ))
                ) : (
                    <span className="text-xs text-slate-600 italic pl-4">No specific timeline projected.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default VerdictElaboration;