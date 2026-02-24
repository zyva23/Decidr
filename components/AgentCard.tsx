import React, { useState } from 'react';
import { AgentResponse } from '../types';
import SequenceModal from './SequenceModal';
import SourcesModal from './SourcesModal';

interface AgentCardProps {
  agent: AgentResponse;
  color: 'blue' | 'purple' | 'red' | 'emerald';
}

const colorMap = {
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-900/10', 
    glow: 'bg-blue-500/10',
    text: 'text-blue-400',
    title: 'text-blue-200',
    badge: 'bg-blue-500/20 text-blue-300',
    hover: 'hover:border-blue-500/60',
    stepBg: 'bg-blue-900/20'
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-900/10',
    glow: 'bg-purple-500/10',
    text: 'text-purple-400',
    title: 'text-purple-200',
    badge: 'bg-purple-500/20 text-purple-300',
    hover: 'hover:border-purple-500/60',
    stepBg: 'bg-purple-900/20'
  },
  red: {
    border: 'border-red-500/30',
    bg: 'bg-red-900/10',
    glow: 'bg-red-500/10',
    text: 'text-red-400',
    title: 'text-red-200',
    badge: 'bg-red-500/20 text-red-300',
    hover: 'hover:border-red-500/60',
    stepBg: 'bg-red-900/20'
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-900/10',
    glow: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    title: 'text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-300',
    hover: 'hover:border-emerald-500/60',
    stepBg: 'bg-emerald-900/20'
  }
};

const AnalystAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
    <defs>
      <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="url(#grad-blue)" strokeWidth="2" />
    <path d="M30 70 L45 50 L60 60 L75 30" stroke="#60a5fa" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="30" cy="70" r="3" fill="#93c5fd" />
    <circle cx="45" cy="50" r="3" fill="#93c5fd" />
    <circle cx="60" cy="60" r="3" fill="#93c5fd" />
    <circle cx="75" cy="30" r="3" fill="#93c5fd" />
  </svg>
);

const StrategistAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
    <defs>
      <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="url(#grad-purple)" strokeWidth="2" />
    <path d="M40 70 L60 70 L60 60 L55 60 L65 40 L50 25 L35 40 L45 60 L40 60 Z" fill="#c084fc" opacity="0.8" />
    <path d="M50 25 L50 15" stroke="#e9d5ff" strokeWidth="3" />
    <circle cx="50" cy="25" r="5" fill="#e9d5ff" />
  </svg>
);

const SkepticAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
    <defs>
      <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="url(#grad-red)" strokeWidth="2" />
    <path d="M50 25 C30 25 25 40 25 50 C25 75 50 85 50 85 C50 85 75 75 75 50 C75 40 70 25 50 25 Z" fill="none" stroke="#f87171" strokeWidth="4" />
    <circle cx="50" cy="50" r="6" fill="#fecaca" />
  </svg>
);

const MediatorAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
    <defs>
      <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="url(#grad-emerald)" strokeWidth="2" />
    <circle cx="35" cy="55" r="7" fill="#6ee7b7" opacity="0.8" />
    <circle cx="65" cy="55" r="7" fill="#6ee7b7" opacity="0.8" />
    <circle cx="50" cy="35" r="7" fill="#6ee7b7" opacity="0.8" />
    <path d="M42 50 L58 50 M45 42 L55 42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AgentCard: React.FC<AgentCardProps> = ({ agent, color }) => {
  const styles = colorMap[color];
  const [isSequenceOpen, setIsSequenceOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  const renderAvatar = () => {
    switch(agent.role) {
      case 'Analyst': return <AnalystAvatar />;
      case 'Strategist': return <StrategistAvatar />;
      case 'Skeptic': return <SkepticAvatar />;
      case 'Mediator': return <MediatorAvatar />;
      default: return null;
    }
  };

  const hasSources = agent.sources && agent.sources.length > 0;

  return (
    <>
      <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-6 flex flex-col h-full backdrop-blur-md transition-all duration-500 ${styles.hover} shadow-2xl relative group overflow-hidden`}>
        
        {/* Background Glow */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 ${styles.glow} rounded-full blur-[80px] group-hover:blur-[60px] transition-all duration-700`}></div>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 z-10 relative">
          <div className="flex gap-4 items-center">
            <div className="transform group-hover:scale-110 transition-transform duration-500">
              {renderAvatar()}
            </div>
            <div>
              <h3 className={`font-black text-xl tracking-tight ${styles.title}`}>{agent.name}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                {agent.role === 'Analyst' ? 'The Rationalist' : 
                 agent.role === 'Strategist' ? 'The Architect' : 
                 agent.role === 'Skeptic' ? 'The Realist' : 
                 'The Ethicist'}
              </p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${styles.badge} shadow-inner`}>
            {agent.score} / 100
          </div>
        </div>

        {/* Analysis Body */}
        <div className="mb-6 text-slate-300 text-sm leading-relaxed flex-grow z-10 relative pl-1 whitespace-pre-wrap font-medium">
          {agent.analysis}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-5 border-t border-slate-800/80 z-10 relative">
          
          {/* Key Findings */}
          <h4 className={`text-[10px] font-black uppercase mb-3 tracking-widest ${styles.text}`}>Strategic Pillars</h4>
          <ul className="space-y-2 mb-6">
            {agent.keyPoints.map((point, idx) => (
              <li key={idx} className="text-xs text-slate-400 flex items-start gap-3">
                <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${styles.text} bg-current`}></span>
                <span className="group-hover:text-slate-200 transition-colors">{point}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            {/* Visualize Button */}
            <button 
                onClick={() => setIsSequenceOpen(true)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 border ${styles.border} hover:bg-slate-800/80 hover:scale-[1.02] active:scale-[0.98] ${styles.text}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Visualize Impact
            </button>

            {/* Sources Button (Icon only) */}
            {hasSources && (
                <button
                    onClick={() => setIsSourcesOpen(true)}
                    className={`px-4 py-3 rounded-xl border ${styles.border} hover:bg-slate-800/80 ${styles.text} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
                    title="View Research Sources"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>
            )}
          </div>
        </div>
      </div>

      <SequenceModal 
        isOpen={isSequenceOpen} 
        onClose={() => setIsSequenceOpen(false)} 
        agent={agent}
        colorTheme={styles}
      />

      <SourcesModal 
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        sources={agent.sources || []}
        role={agent.role}
      />
    </>
  );
};

export default AgentCard;
