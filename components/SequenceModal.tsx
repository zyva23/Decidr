import React, { useState } from 'react';
import { AgentResponse } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentResponse;
  colorTheme: {
    text: string;
    bg: string;
    border: string;
    stepBg: string;
  };
}

type TabType = 'timeline' | 'projections' | 'alternatives';

const SequenceModal: React.FC<SequenceModalProps> = ({ isOpen, onClose, agent, colorTheme }) => {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  if (!isOpen) return null;

  // Helper to determine border color class based on theme text color class
  // colorTheme.text is like "text-blue-400"
  const getBorderColorClass = () => {
    if (colorTheme.text.includes('blue')) return 'border-blue-500';
    if (colorTheme.text.includes('purple')) return 'border-purple-500';
    if (colorTheme.text.includes('red')) return 'border-red-500';
    if (colorTheme.text.includes('emerald')) return 'border-emerald-500';
    return 'border-indigo-500';
  };
  
  const borderColorClass = getBorderColorClass();

  const renderTimeline = () => (
    <div className="relative">
      <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-800"></div>
      {agent.sequence && agent.sequence.length > 0 ? (
        <div className="space-y-8">
          {agent.sequence.map((event, idx) => (
            <div key={idx} className="relative pl-16 group">
              <div className={`absolute left-[20px] top-1.5 w-3 h-3 rounded-full border-2 z-10 bg-slate-900 transition-all duration-300 group-hover:scale-125 ${
                event.impact === 'positive' ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                event.impact === 'negative' ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                'border-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]'
              }`}></div>
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    event.impact === 'positive' ? 'text-emerald-400' :
                    event.impact === 'negative' ? 'text-red-400' :
                    'text-indigo-300'
                  }`}>
                    {event.step}
                  </span>
                  {idx === agent.sequence.length - 1 && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Outcome</span>
                  )}
                </div>
                <p className="text-slate-200 leading-relaxed text-sm">
                  {event.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">No sequence data available.</div>
      )}
    </div>
  );

  const renderProjections = () => (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h4 className="text-slate-300 font-bold mb-2">Projected Trend: {agent.chartLabel || "Impact Over Time"}</h4>
        <p className="text-slate-500 text-sm">Visualizing the trajectory of this decision based on {agent.role} metrics.</p>
      </div>
      
      <div className="flex-1 min-h-[300px] bg-slate-800/20 rounded-xl p-4 border border-slate-800">
        {agent.chartData && agent.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={agent.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 12}} />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="value" stroke="#818cf8" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            No quantitative projection data available.
          </div>
        )}
      </div>
    </div>
  );

  const renderAlternatives = () => (
    <div className="space-y-6">
      <h4 className="text-slate-300 font-bold">Alternative Futures</h4>
      <p className="text-slate-500 text-sm -mt-4 mb-6">Divergent paths that could unfold depending on external variables.</p>
      
      {agent.alternativeScenarios && agent.alternativeScenarios.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {agent.alternativeScenarios.map((scenario, idx) => (
            <div key={idx} className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/60 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h5 className="font-bold text-white text-lg">{scenario.name}</h5>
                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide ${
                  scenario.likelihood.toLowerCase().includes('high') ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                  'bg-slate-700/50 text-slate-400 border-slate-600'
                }`}>
                  {scenario.likelihood} Likelihood
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">{scenario.description}</p>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Final Outcome</span>
                <p className="text-slate-200 text-sm">{scenario.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">No alternative scenarios generated.</div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-fade-in">
        
        {/* Header */}
        <div className={`p-6 border-b border-slate-800 flex justify-between items-center ${colorTheme.bg}`}>
          <div>
            <h3 className={`text-xl font-bold ${colorTheme.text}`}>{agent.name} Simulation</h3>
            <p className="text-slate-400 text-sm">Deep Dive Analysis & Forecasting</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'timeline' ? `${borderColorClass} text-white` : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Timeline
          </button>
          <button 
            onClick={() => setActiveTab('projections')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'projections' ? `${borderColorClass} text-white` : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Data Projections
          </button>
          <button 
            onClick={() => setActiveTab('alternatives')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'alternatives' ? `${borderColorClass} text-white` : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Alt. Scenarios
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/30">
          {activeTab === 'timeline' && renderTimeline()}
          {activeTab === 'projections' && renderProjections()}
          {activeTab === 'alternatives' && renderAlternatives()}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs text-slate-500">
           <span>Strategy Insight Engine</span>
           <span>Confidence Score: {agent.score}/100</span>
        </div>
      </div>
    </div>
  );
};

export default SequenceModal;