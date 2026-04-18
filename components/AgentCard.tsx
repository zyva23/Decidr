import React, { useState, useEffect } from 'react';
import { AgentResponse, Contribution } from '../types';
import SequenceModal from './SequenceModal';
import SourcesModal from './SourcesModal';

interface AgentCardProps {
  agent?: AgentResponse;
  role: 'Analyst' | 'Strategist' | 'Skeptic' | 'Mediator' | 'Human';
  color: 'blue' | 'purple' | 'red' | 'emerald' | 'indigo';
  isLoading?: boolean;
  type?: Contribution['type'];
  history?: AgentResponse[]; // Full history for versioning
}

const colorMap = {
  blue: { border: 'border-blue-500/30', bg: 'bg-blue-900/10', glow: 'bg-blue-500/10', text: 'text-blue-400', title: 'text-blue-200', badge: 'bg-blue-500/20 text-blue-300', hover: 'hover:border-blue-500/60', stepBg: 'bg-blue-900/20' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-900/10', glow: 'bg-purple-500/10', text: 'text-purple-400', title: 'text-purple-200', badge: 'bg-purple-500/20 text-purple-300', hover: 'hover:border-purple-500/60', stepBg: 'bg-purple-900/20' },
  red: { border: 'border-red-500/30', bg: 'bg-red-900/10', glow: 'bg-red-500/10', text: 'text-red-400', title: 'text-red-200', badge: 'bg-red-500/20 text-red-300', hover: 'hover:border-red-500/60', stepBg: 'bg-red-900/20' },
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-900/10', glow: 'bg-emerald-500/10', text: 'text-emerald-400', title: 'text-emerald-200', badge: 'bg-emerald-500/20 text-emerald-300', hover: 'hover:border-emerald-500/60', stepBg: 'bg-emerald-900/20' },
  indigo: { border: 'border-indigo-500/30', bg: 'bg-indigo-900/10', glow: 'bg-indigo-500/10', text: 'text-indigo-400', title: 'text-indigo-200', badge: 'bg-indigo-500/20 text-indigo-300', hover: 'hover:border-indigo-500/60', stepBg: 'bg-indigo-900/20' }
};

const typeFlagMap = {
  risk: { label: '🚩 Risk', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  variable: { label: '🧩 Variable', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  alternative: { label: '💡 Alternative', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  thought: { label: '🧠 Thought', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' }
};

const HumanAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
    <path d="M50 30 A15 15 0 1 1 50 60 A15 15 0 1 1 50 30 M30 85 C30 70 70 70 70 85" stroke="#818cf8" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

const AnalystAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
    <path d="M30 70 L45 50 L60 60 L75 30" stroke="#60a5fa" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

const StrategistAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
    <path d="M40 70 L60 70 L50 25 Z" fill="#c084fc" opacity="0.8" />
  </svg>
);

const SkepticAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
    <path d="M50 25 C30 25 25 40 25 50 C25 75 50 85 50 85 C50 85 75 75 75 50 C75 40 70 25 50 25 Z" fill="none" stroke="#f87171" strokeWidth="4" />
  </svg>
);

const MediatorAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
    <circle cx="35" cy="55" r="7" fill="#6ee7b7" /><circle cx="65" cy="55" r="7" fill="#6ee7b7" /><circle cx="50" cy="35" r="7" fill="#6ee7b7" />
  </svg>
);

const AgentCard: React.FC<AgentCardProps> = ({ agent, role, color, isLoading, type, history = [] }) => {
  const styles = colorMap[color];
  const [localIndex, setLocalIndex] = useState(-1); // -1 means latest active
  const [isSequenceOpen, setIsSequenceOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  // Auto-reset local index when a new deliberated result comes in
  useEffect(() => {
    if (isLoading) setLocalIndex(-1);
  }, [isLoading]);

  const allVersions = [...history, ...(agent ? [agent] : [])];
  const totalVersions = allVersions.length;
  const currentIndex = localIndex === -1 ? totalVersions - 1 : localIndex;
  const activeAgent = allVersions[currentIndex];

  const renderAvatar = () => {
    switch(role) {
      case 'Analyst': return <AnalystAvatar />;
      case 'Strategist': return <StrategistAvatar />;
      case 'Skeptic': return <SkepticAvatar />;
      case 'Mediator': return <MediatorAvatar />;
      case 'Human': return <HumanAvatar />;
      default: return null;
    }
  };

  const hasSources = !!activeAgent?.sources && Array.isArray(activeAgent.sources) && activeAgent.sources.length > 0;
  const hasKeyPoints = !!activeAgent?.keyPoints && Array.isArray(activeAgent.keyPoints);

  return (
    <>
      <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-6 flex flex-col h-full backdrop-blur-md transition-all duration-500 ${styles.hover} shadow-2xl relative group overflow-hidden`}>
        <div className={`absolute -top-24 -right-24 w-48 h-48 ${styles.glow} rounded-full blur-[80px] transition-all duration-700`}></div>
        
        {/* Local Version Switcher */}
        {totalVersions > 1 && !isLoading && (
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-all z-20">
             <button 
               onClick={(e) => { e.stopPropagation(); setLocalIndex(prev => Math.max(0, (prev === -1 ? totalVersions - 1 : prev) - 1)); }}
               disabled={currentIndex === 0}
               className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             </button>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter w-8 text-center">V{currentIndex + 1}</span>
             <button 
               onClick={(e) => { e.stopPropagation(); setLocalIndex(prev => prev === totalVersions - 1 ? -1 : prev + 1); }}
               disabled={localIndex === -1}
               className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
             </button>
          </div>
        )}

        {isLoading || !activeAgent || !activeAgent.name ? (
          <div className="flex flex-col h-full items-center justify-center py-12 animate-pulse">
             <div className="mb-4">{renderAvatar()}</div>
             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Archetype Deliberating...</div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6 z-10 relative">
              <div className="flex gap-4 items-center">
                <div className="transform group-hover:scale-110 transition-transform duration-500">{renderAvatar()}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-black text-xl tracking-tight ${styles.title}`}>{activeAgent.name}</h3>
                    {role === 'Human' && type && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${typeFlagMap[type].color}`}>
                        {typeFlagMap[type].label}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                    {role === 'Analyst' ? 'The Rationalist' : role === 'Strategist' ? 'The Architect' : role === 'Skeptic' ? 'The Realist' : role === 'Mediator' ? 'The Ethicist' : 'Human Perspective'}
                  </p>
                </div>
              </div>
              {role !== 'Human' && (
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${styles.badge} shadow-inner`}>
                  {activeAgent.score || 0} / 100
                </div>
              )}
            </div>
            <div className="mb-6 text-slate-300 text-sm leading-relaxed flex-grow z-10 relative pl-1 whitespace-pre-wrap font-medium h-auto min-h-[100px]">{activeAgent.analysis || "Synthesizing perspectives..."}</div>
            <div className="mt-auto pt-5 border-t border-slate-800/80 z-10 relative">
              <h4 className={`text-[10px] font-black uppercase mb-3 tracking-widest ${styles.text}`}>Strategic Pillars</h4>
              <ul className="space-y-2 mb-6">
                {hasKeyPoints ? activeAgent.keyPoints.map((point, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-3">
                    <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${styles.text} bg-current`}></span>
                    <span className="group-hover:text-slate-200 transition-colors">{point}</span>
                  </li>
                )) : (
                  <li className="text-xs text-slate-600 italic">Extracting key findings...</li>
                )}
              </ul>
              <div className="flex gap-3">
                {role !== 'Human' && (
                  <button 
                    onClick={() => setIsSequenceOpen(true)} 
                    disabled={!activeAgent.sequence}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 border ${styles.border} hover:bg-slate-800/80 hover:scale-[1.02] active:scale-[0.98] ${styles.text} disabled:opacity-30`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    Visualize Impact
                  </button>
                )}
                {hasSources && (
                    <button onClick={() => setIsSourcesOpen(true)} className={`px-4 py-3 rounded-xl border ${styles.border} hover:bg-slate-800/80 ${styles.text} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`} title="View Research Sources"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {activeAgent && activeAgent.sequence && <SequenceModal isOpen={isSequenceOpen} onClose={() => setIsSequenceOpen(false)} agent={activeAgent} colorTheme={styles} />}
      {activeAgent && hasSources && <SourcesModal isOpen={isSourcesOpen} onClose={() => setIsSourcesOpen(false)} sources={activeAgent.sources || []} role={role} />}
    </>
  );
};

export default AgentCard;
