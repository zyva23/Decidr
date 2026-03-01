import React, { useState, useEffect, useRef } from 'react';
import { ActionPlan, PlanPhase, PivotPoint, PlanTask } from '../types';

interface AutoExpandingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

const AutoExpandingTextarea: React.FC<AutoExpandingTextareaProps> = ({ value, className, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={1}
      className={`resize-none overflow-hidden transition-all duration-200 ${className}`}
      {...props}
    />
  );
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedPlan: ActionPlan) => void;
  plan: ActionPlan;
}

const ActionPlanModal: React.FC<Props> = ({ isOpen, onClose, onSave, plan }) => {
  const [localPlan, setLocalPlan] = useState<ActionPlan>(plan);
  const [isEdited, setIsCompletelyEdited] = useState(false);

  useEffect(() => {
    setLocalPlan(plan);
  }, [plan]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave) {
      onSave(localPlan);
      setIsCompletelyEdited(false);
    }
  };

  const updateSummary = (val: string) => {
    setLocalPlan(prev => ({ ...prev, executiveSummary: val }));
    setIsCompletelyEdited(true);
  };

  const updatePivot = (idx: number, field: keyof PivotPoint, val: string) => {
    const newPivots = [...localPlan.pivotPoints];
    newPivots[idx] = { ...newPivots[idx], [field]: val };
    setLocalPlan(prev => ({ ...prev, pivotPoints: newPivots }));
    setIsCompletelyEdited(true);
  };

  const updatePhase = (idx: number, field: keyof PlanPhase, val: string) => {
    const newPhases = [...localPlan.phases];
    newPhases[idx] = { ...newPhases[idx], [field]: val };
    setLocalPlan(prev => ({ ...prev, phases: newPhases }));
    setIsCompletelyEdited(true);
  };

  const updateTask = (pIdx: number, tIdx: number, field: keyof PlanTask, val: string) => {
    const newPhases = [...localPlan.phases];
    const newTasks = [...newPhases[pIdx].tasks];
    newTasks[tIdx] = { ...newTasks[tIdx], [field]: val };
    newPhases[pIdx] = { ...newPhases[pIdx], tasks: newTasks };
    setLocalPlan(prev => ({ ...prev, phases: newPhases }));
    setIsCompletelyEdited(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-fade-in">
        
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Execution Roadmap</h2>
              <p className="text-slate-400 text-sm">Review and customize your tactical path</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEdited && (
               <span className="text-[10px] font-bold text-amber-500 uppercase bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">Unsaved Changes</span>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10 bg-slate-950/30">
          
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Strategy Summary</h3>
            <AutoExpandingTextarea 
              value={localPlan.executiveSummary}
              onChange={(e) => updateSummary(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 text-slate-200 leading-relaxed text-lg focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
            />
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Strategic Pivot Points
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localPlan.pivotPoints.map((pp, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all flex flex-col">
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase text-amber-500/80 tracking-wide block mb-1">Trigger Condition</span>
                    <AutoExpandingTextarea 
                      value={pp.trigger}
                      onChange={(e) => updatePivot(idx, 'trigger', e.target.value)}
                      className="w-full bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-amber-500/30 pb-1"
                    />
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide block mb-1">Required Reaction</span>
                    <AutoExpandingTextarea 
                      value={pp.reaction}
                      onChange={(e) => updatePivot(idx, 'reaction', e.target.value)}
                      className="w-full bg-transparent text-slate-300 text-sm outline-none border-b border-transparent focus:border-amber-500/30 pb-1"
                    />
                  </div>
                  <div className="mt-3 flex justify-end shrink-0">
                    <input 
                      value={pp.owner}
                      onChange={(e) => updatePivot(idx, 'owner', e.target.value)}
                      className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 outline-none w-full text-right max-w-[120px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M9 18l6-6-6-6"/></svg>
              Implementation Phases
            </h3>
            <div className="space-y-8 relative">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800"></div>

              {localPlan.phases.map((phase, idx) => (
                <div key={idx} className="relative pl-12">
                  <div className="absolute left-1.5 top-0 w-6 h-6 rounded-full bg-slate-900 border-4 border-indigo-600 z-10"></div>
                  
                  <div className="bg-slate-800/30 border border-slate-700/60 rounded-xl overflow-hidden">
                    <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex flex-wrap gap-4 justify-between items-center">
                      <div className="flex-1 min-w-[200px]">
                        <AutoExpandingTextarea 
                          value={phase.name}
                          onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                          className="w-full bg-transparent text-lg font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500/30 rounded px-1"
                        />
                        <AutoExpandingTextarea 
                          value={phase.objective}
                          onChange={(e) => updatePhase(idx, 'objective', e.target.value)}
                          className="w-full bg-transparent text-sm text-indigo-300 font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 rounded px-1 mt-1"
                        />
                      </div>
                      <input 
                        value={phase.duration}
                        onChange={(e) => updatePhase(idx, 'duration', e.target.value)}
                        className="text-xs font-bold uppercase bg-slate-900 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700 outline-none w-28 text-center"
                      />
                    </div>
                    
                    <div className="divide-y divide-slate-700/50">
                      {phase.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row gap-4 md:items-center justify-between group">
                           <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1 w-4 h-4 rounded border border-slate-600 flex items-center justify-center shrink-0"></div>
                              <div className="flex-1">
                                <AutoExpandingTextarea 
                                  value={task.description}
                                  onChange={(e) => updateTask(idx, tIdx, 'description', e.target.value)}
                                  className="w-full bg-transparent text-slate-200 text-sm font-medium outline-none focus:border-b focus:border-indigo-500/30"
                                />
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Owner:</span>
                                  <input 
                                    value={task.owner}
                                    onChange={(e) => updateTask(idx, tIdx, 'owner', e.target.value)}
                                    className="bg-transparent text-[10px] text-slate-500 outline-none w-32 focus:text-slate-300"
                                  />
                                </div>
                              </div>
                           </div>
                           <div className="pl-7 md:pl-0">
                             <div className="flex items-center gap-2 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                                <span className="text-[10px] text-emerald-500/50 font-bold uppercase">KPI:</span>
                                <AutoExpandingTextarea 
                                  value={task.kpi}
                                  onChange={(e) => updateTask(idx, tIdx, 'kpi', e.target.value)}
                                  className="bg-transparent text-xs font-mono text-emerald-400 outline-none min-w-[150px]"
                                />
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
        
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2">Review Mode</div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-2 text-slate-400 hover:text-white font-bold text-sm transition-colors uppercase tracking-widest">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={!isEdited}
                className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:grayscale text-white font-black text-sm rounded-lg transition-all uppercase tracking-widest shadow-lg shadow-emerald-500/20"
              >
                Save Roadmap
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActionPlanModal;
