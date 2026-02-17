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
    bg: 'bg-blue-900/10', // Darker/Warmer alpha
    text: 'text-blue-400',
    title: 'text-blue-200',
    badge: 'bg-blue-500/20 text-blue-300',
    hover: 'hover:border-blue-500/50',
    stepBg: 'bg-blue-900/20'
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-900/10',
    text: 'text-purple-400',
    title: 'text-purple-200',
    badge: 'bg-purple-500/20 text-purple-300',
    hover: 'hover:border-purple-500/50',
    stepBg: 'bg-purple-900/20'
  },
  red: {
    border: 'border-red-500/30',
    bg: 'bg-red-900/10',
    text: 'text-red-400',
    title: 'text-red-200',
    badge: 'bg-red-500/20 text-red-300',
    hover: 'hover:border-red-500/50',
    stepBg: 'bg-red-900/20'
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-900/10',
    text: 'text-emerald-400',
    title: 'text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-300',
    hover: 'hover:border-emerald-500/50',
    stepBg: 'bg-emerald-900/20'
  }
};

const AnalystAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="currentColor" className="text-slate-900" stroke="currentColor" strokeWidth="2" />
    <path d="M30 70 L45 50 L60 60 L75 30" stroke="currentColor" strokeWidth="4" fill="none" className="text-blue-400" />
    <circle cx="30" cy="70" r="3" fill="currentColor" className="text-blue-300" />
    <circle cx="45" cy="50" r="3" fill="currentColor" className="text-blue-300" />
    <circle cx="60" cy="60" r="3" fill="currentColor" className="text-blue-300" />
    <circle cx="75" cy="30" r="3" fill="currentColor" className="text-blue-300" />
    <rect x="35" y="30" width="10" height="2" fill="currentColor" className="text-blue-500" opacity="0.5"/>
    <rect x="35" y="35" width="20" height="2" fill="currentColor" className="text-blue-500" opacity="0.5"/>
  </svg>
);

const StrategistAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="currentColor" className="text-slate-900" stroke="currentColor" strokeWidth="2" />
    <path d="M40 70 L60 70 L60 60 L55 60 L65 40 L50 25 L35 40 L45 60 L40 60 Z" fill="none" stroke="currentColor" strokeWidth="3" className="text-purple-400" />
    <path d="M50 25 L65 40" stroke="currentColor" strokeWidth="2" className="text-purple-400" />
    <circle cx="50" cy="25" r="4" fill="currentColor" className="text-purple-300" />
    <rect x="35" y="70" width="30" height="4" fill="currentColor" className="text-purple-500" />
  </svg>
);

const SkepticAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="currentColor" className="text-slate-900" stroke="currentColor" strokeWidth="2" />
    <path d="M50 25 C30 25 25 40 25 50 C25 75 50 85 50 85 C50 85 75 75 75 50 C75 40 70 25 50 25 Z" fill="none" stroke="currentColor" strokeWidth="3" className="text-red-400" />
    <circle cx="50" cy="50" r="8" fill="currentColor" className="text-red-300" />
    <path d="M48 35 L52 35 L50 40 Z" fill="currentColor" className="text-red-500" />
  </svg>
);

const MediatorAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="currentColor" className="text-slate-900" stroke="currentColor" strokeWidth="2" />
    <circle cx="35" cy="55" r="8" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400" />
    <circle cx="65" cy="55" r="8" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400" />
    <circle cx="50" cy="35" r="8" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400" />
    <line x1="42" y1="50" x2="58" y2="50" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
    <line x1="40" y1="42" x2="45" y2="38" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
    <line x1="60" y1="42" x2="55" y2="38" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
  </svg>
);

const AgentCard: React.FC<AgentCardProps> = ({ agent, color }) => {
  const styles = colorMap[color];
  const [isSequenceOpen, setIsSequenceOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  const renderAvatar = () => {
    switch(agent.role) {
      case 'Analyst': return <div className="text-blue-500"><AnalystAvatar /></div>;
      case 'Strategist': return <div className="text-purple-500"><StrategistAvatar /></div>;
      case 'Skeptic': return <div className="text-red-500"><SkepticAvatar /></div>;
      case 'Mediator': return <div className="text-emerald-500"><MediatorAvatar /></div>;
      default: return null;
    }
  };

  const hasSources = agent.sources && agent.sources.length > 0;

  return (
    <>
      <div className={`rounded-xl border ${styles.border} ${styles.bg} p-5 flex flex-col h-full backdrop-blur-sm transition-all ${styles.hover} shadow-lg relative group overflow-hidden`}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4 z-10 relative">
          <div className="flex gap-3 items-center">
            <div className="drop-shadow-lg">
              {renderAvatar()}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${styles.title}`}>{agent.name}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{agent.role === 'Analyst' ? 'Quantitative Lens' : agent.role === 'Strategist' ? 'Game Theory Lens' : agent.role === 'Skeptic' ? 'Pre-Mortem Lens' : 'Stakeholder Lens'}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-bold ${styles.badge}`}>
            Score: {agent.score}
          </div>
        </div>

        {/* Analysis Body */}
        <div className="mb-4 text-slate-300 text-sm leading-relaxed flex-grow z-10 relative pl-1 whitespace-pre-wrap">
          {agent.analysis}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-slate-700/50 z-10 relative">
          
          {/* Key Findings */}
          <h4 className={`text-xs font-bold uppercase mb-2 ${styles.text}`}>Key Findings</h4>
          <ul className="space-y-1 mb-4">
            {agent.keyPoints.map((point, idx) => (
              <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.badge}`}></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            {/* Visualize Button */}
            <button 
                onClick={() => setIsSequenceOpen(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${styles.border} hover:bg-slate-800 ${styles.text}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Visualize
            </button>

            {/* Sources Button (Icon only) */}
            {hasSources && (
                <button
                    onClick={() => setIsSourcesOpen(true)}
                    className={`px-3 py-2 rounded-lg border ${styles.border} hover:bg-slate-800 ${styles.text} transition-all`}
                    title="View Research Sources"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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