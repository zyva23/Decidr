import React from 'react';
import { ActionPlan } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plan: ActionPlan;
}

const ActionPlanModal: React.FC<Props> = ({ isOpen, onClose, plan }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Execution Roadmap</h2>
              <p className="text-slate-400 text-sm">Tactical breakdown and strategic pivot points</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10 bg-slate-950/30">
          
          {/* Executive Summary */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Strategy Summary</h3>
            <p className="text-slate-200 leading-relaxed text-lg">{plan.executiveSummary}</p>
          </div>

          {/* Pivot Points / Tripwires (Horizontal Cards) */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Strategic Pivot Points
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plan.pivotPoints.map((pp, idx) => (
                <div key={idx} className="bg-slate-900 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase text-amber-500/80 tracking-wide block mb-1">Trigger Condition</span>
                    <p className="text-white font-medium">{pp.trigger}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide block mb-1">Required Reaction</span>
                    <p className="text-slate-300 text-sm">{pp.reaction}</p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">Owner: {pp.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Phases (Vertical Timeline) */}
          <section>
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M9 18l6-6-6-6"/></svg>
              Implementation Phases
            </h3>
            <div className="space-y-8 relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800"></div>

              {plan.phases.map((phase, idx) => (
                <div key={idx} className="relative pl-12">
                  {/* Timeline Dot */}
                  <div className="absolute left-1.5 top-0 w-6 h-6 rounded-full bg-slate-900 border-4 border-indigo-600 z-10"></div>
                  
                  {/* Phase Card */}
                  <div className="bg-slate-800/30 border border-slate-700/60 rounded-xl overflow-hidden">
                    {/* Phase Header */}
                    <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex flex-wrap gap-4 justify-between items-center">
                      <div>
                        <h4 className="text-lg font-bold text-white">{phase.name}</h4>
                        <p className="text-sm text-indigo-300 font-medium">{phase.objective}</p>
                      </div>
                      <span className="text-xs font-bold uppercase bg-slate-900 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700">
                        Duration: {phase.duration}
                      </span>
                    </div>
                    
                    {/* Tasks */}
                    <div className="divide-y divide-slate-700/50">
                      {phase.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row gap-4 md:items-center justify-between group">
                           <div className="flex items-start gap-3">
                              <div className="mt-1 w-4 h-4 rounded border border-slate-600 group-hover:border-indigo-500 cursor-pointer flex items-center justify-center transition-colors">
                                {/* Checkbox simulation */}
                              </div>
                              <div>
                                <p className="text-slate-200 text-sm font-medium">{task.description}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Owner: {task.owner}</p>
                              </div>
                           </div>
                           <div className="pl-7 md:pl-0">
                             <div className="text-xs font-mono text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 inline-block">
                               KPI: {task.kpi}
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
            <div className="text-xs text-slate-500">Generated by Plan Agent (Gemini 2.5)</div>
            <button onClick={onClose} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors">
              Close Plan
            </button>
        </div>
      </div>
    </div>
  );
};

export default ActionPlanModal;