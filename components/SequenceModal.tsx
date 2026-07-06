import React from 'react';
import { AgentResponse } from '../types';

interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentResponse;
  colorTheme: any;
}

const SequenceModal: React.FC<SequenceModalProps> = ({ isOpen, onClose, agent, colorTheme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 lg:p-12">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full bg-current ${colorTheme.text} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
            <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{agent.name} Trajectory</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Impact Mapping & Sequence projection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-950/30">
          {agent.sequence && agent.sequence.length > 0 ? agent.sequence.map((event, i) => (
            <div key={i} className="flex gap-6 relative group">
              {/* Timeline Connector */}
              {i < agent.sequence!.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-slate-800 group-hover:bg-indigo-500/30 transition-colors"></div>
              )}
              
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full border-2 ${colorTheme.border} bg-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                   <div className={`w-2 h-2 rounded-full bg-current ${colorTheme.text}`}></div>
                </div>
              </div>

              <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 mb-4 group-hover:bg-slate-800 group-hover:border-indigo-500/30 transition-all shadow-xl">
                <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${colorTheme.text}`}>{event.step}</span>
                    <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                        event.impact === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                        event.impact === 'negative' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                        {event.impact}
                    </span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed font-medium italic">"{event.detail}"</p>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center text-slate-500 italic">No sequence projection available for this expert.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">Strategic Sequence Projection</p>
        </div>
      </div>
    </div>
  );
};

export default SequenceModal;
