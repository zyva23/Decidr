import React, { useState } from 'react';
import { Contribution, DecisionSession } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: DecisionSession | null;
  contributions: Contribution[];
  onSynthesize: (selectedIds: string[], notify: boolean) => void;
  isSynthesizing: boolean;
  isOwner: boolean;
  onSubmitContribution: (name: string, content: string, type: Contribution['type'], isAnonymous: boolean) => Promise<void>;
  isContributing: boolean;
  isAuthenticated: boolean;
}

const typeConfig = {
  risk: { icon: '🚩', label: 'Risk', color: 'text-red-400', bg: 'bg-red-500/10' },
  variable: { icon: '🧩', label: 'Variable', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  alternative: { icon: '💡', label: 'Alternative', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  thought: { icon: '🧠', label: 'Self Thought', color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
};

const CollaborationModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  session, 
  contributions, 
  onSynthesize, 
  isSynthesizing, 
  isOwner,
  onSubmitContribution,
  isContributing,
  isAuthenticated
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notify, setNotify] = useState(true);
  
  // Contribution Form State
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Contribution['type']>('variable');
  const [isAnonymous, setIsAnonymous] = useState(!isAuthenticated);
  const [showForm, setShowForm] = useState(!isOwner);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    if (!isOwner) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isFormValid = content.trim() !== '' && (isAnonymous || name.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    await onSubmitContribution(name, content, type, isAnonymous);
    setContent('');
    if (isOwner) setShowForm(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1A1D21] border border-slate-700/50 rounded-2xl max-w-2xl w-full shadow-2xl animate-fade-in flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Loading Overlay for Synthesis */}
        {isSynthesizing && (
          <div className="absolute inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
            <div className="w-16 h-16 relative mb-6">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Re-Synthesizing</h3>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Incorporating peer insights into the Master Verdict...</p>
          </div>
        )}

        {/* Slack-style Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-[#121519]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-900/20">
              #
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                strategic-peer-review
                <span className="text-[10px] text-slate-500 font-medium">({contributions.length} experts)</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Deliberation Feed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isOwner && !showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/30 px-3 py-1.5 rounded-lg bg-indigo-500/5"
              >
                + Add Perspective
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Message Feed Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1A1D21]">
          {contributions.length === 0 && !showForm ? (
            <div className="py-24 text-center opacity-40">
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p className="text-sm font-medium">No human perspectives in this channel.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/30">
              {contributions.sort((a, b) => b.timestamp - a.timestamp).map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => toggleSelection(c.id)}
                  className={`flex gap-4 p-6 transition-all ${isOwner ? 'cursor-pointer hover:bg-[#222529]' : ''} ${
                    isOwner && selectedIds.includes(c.id) ? 'bg-indigo-500/5 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Avatar Column */}
                  <div className="shrink-0 pt-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold shadow-inner border border-slate-700 transition-colors">
                      {c.name[0].toUpperCase()}
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-black text-sm text-slate-200">{c.name}</span>
                      <span className="text-[10px] text-slate-600 font-bold">
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {c.status === 'accepted' && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">Incorporated</span>
                      )}
                    </div>

                    <div className="mb-2">
                      {c.type && typeConfig[c.type] ? (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${typeConfig[c.type].bg} ${typeConfig[c.type].color} border-current opacity-70`}>
                          {typeConfig[c.type].icon} {typeConfig[c.type].label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border bg-slate-800 text-slate-400 border-slate-700 opacity-70">
                          🧩 Variable
                        </span>
                      )}
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    
                    {isOwner && (
                      <div className="mt-3 flex items-center gap-2">
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedIds.includes(c.id) ? 'bg-indigo-500 border-indigo-400 scale-110' : 'border-slate-700'}`}>
                           {selectedIds.includes(c.id) && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                         </div>
                         <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedIds.includes(c.id) ? 'text-indigo-400' : 'text-slate-600'}`}>
                           {selectedIds.includes(c.id) ? 'Selected for Synthesis' : 'Select to Incorporate'}
                         </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contribution Form Overlay/Drawer */}
        {showForm && (
          <div className="p-6 bg-[#121519] border-t border-slate-700/50 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contribute Perspective</h4>
              {isOwner && (
                <button onClick={() => setShowForm(false)} className="text-[10px] font-bold text-slate-600 hover:text-slate-400 transition-colors uppercase">Cancel</button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  {!isAnonymous && (
                    <input 
                      type="text"
                      placeholder="Your Name (Required)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#1A1D21] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      required
                    />
                  )}
                </div>
                {isAuthenticated && (
                  <div className="flex items-center gap-3 bg-[#1A1D21] border border-slate-700 rounded-xl px-4 py-2 shadow-inner">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anonymous</span>
                    <button 
                      type="button"
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`w-10 h-5 rounded-full transition-all relative ${isAnonymous ? 'bg-indigo-600' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAnonymous ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {(['variable', 'risk', 'alternative', 'thought'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 min-w-[90px] py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      type === t 
                        ? `${typeConfig[t].bg} ${typeConfig[t].color} border-current` 
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {typeConfig[t].icon} {typeConfig[t].label}
                  </button>
                ))}
              </div>

              <textarea 
                placeholder="Share your insight, risk observation, or alternative path..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#1A1D21] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none shadow-inner"
              />

              <button
                type="submit"
                disabled={!isFormValid || isContributing}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 ${
                  !isFormValid || isContributing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 active:scale-[0.98]'
                }`}
              >
                {isContributing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Transmitting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    Submit Perspective
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Controls (Only for Owner) */}
        {isOwner && (
          <div className="p-6 bg-[#121519] border-t border-slate-700/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-300">Notify Contributors</span>
                  <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Sync selection to expert feed</span>
                </div>
                <button 
                  onClick={() => setNotify(!notify)}
                  className={`w-10 h-5 rounded-full transition-all relative ${notify ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notify ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <button
                onClick={() => onSynthesize(selectedIds, notify)}
                disabled={selectedIds.length === 0 || isSynthesizing}
                className={`px-8 py-3 rounded-xl font-black uppercase tracking-[0.15em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 min-w-[200px] ${
                  selectedIds.length === 0 || isSynthesizing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 active:scale-[0.98]'
                }`}
              >
                {isSynthesizing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 18H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-5"/><path d="m15 13-3 3-3-3"/><path d="M12 16V2"/></svg>
                    Incorporating {selectedIds.length} Insights
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationModal;
