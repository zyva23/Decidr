import React, { useState } from 'react';
import { UI_CONTENT } from '../src/constants/uiContent';
import MindfulCommitModal from './MindfulCommitModal';

interface CommitmentPanelProps {
  options: string;
  refinedPaths?: string[];
  onCommit: (selected: string, why: string) => void;
  onBranch: (newContext: string) => void;
  onConsult: () => void;
  coreInquiry: string; // New prop
  existingCommitment?: { selectedOption: string; justification: string; };
}

const CommitmentPanel: React.FC<CommitmentPanelProps> = ({ options, refinedPaths, onCommit, onBranch, onConsult, coreInquiry, existingCommitment }) => {
  const [selected, setSelected] = useState(existingCommitment?.selectedOption || '');
  const [customPath, setCustomPath] = useState('');
  const [why, setWhy] = useState(existingCommitment?.justification || '');
  const [isCommitted, setIsCommitted] = useState(!!existingCommitment);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const parseOptions = (text: string) => {
    const parts = text.split(/(?:\n|^)(?:Path\s+[A-Z]:|Option\s+\d+:|[A-Z]:|\d+\.|\*|•)\s*/i);
    return parts.map(p => p.trim()).filter(p => p.length > 5);
  };

  const optionList = (refinedPaths && refinedPaths.length > 0) 
    ? refinedPaths 
    : parseOptions(options);

  const initiateCommitment = () => {
    const finalChoice = selected === 'CUSTOM' ? customPath : selected;
    if (!finalChoice || !why) return;
    setIsModalOpen(true);
  };

  const finalConfirm = () => {
    const finalChoice = selected === 'CUSTOM' ? customPath : selected;
    onCommit(finalChoice, why);
    setIsCommitted(true);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-8 shadow-2xl animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>

      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
        {UI_CONTENT.COMMITMENT.TITLE}
      </h3>
      <p className="text-sm text-slate-400 mb-8 max-w-xl">
        {UI_CONTENT.COMMITMENT.DESCRIPTION}
      </p>

      {!isCommitted ? (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">{UI_CONTENT.COMMITMENT.LABEL_PATH}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {optionList.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(opt)}
                  className={`p-4 text-left rounded-xl border transition-all ${
                    selected === opt 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold opacity-50 mb-1">
                    {refinedPaths && refinedPaths.length > 0 ? "Strategic Path" : `Option ${String.fromCharCode(65 + i)}`}
                  </div>
                  <div className="text-sm font-medium">{opt.replace(/^[A-Z]:\s*/i, '')}</div>
                </button>
              ))}
              
              <button
                onClick={() => setSelected('CUSTOM')}
                className={`p-4 text-left rounded-xl border transition-all ${
                  selected === 'CUSTOM' 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold opacity-50 mb-1">Divergent Path</div>
                <div className="text-sm font-medium">Something else...</div>
              </button>
            </div>

            {selected === 'CUSTOM' && (
              <div className="mt-4 animate-fade-in">
                <input 
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="Describe your alternative path..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-inner"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">{UI_CONTENT.COMMITMENT.LABEL_WHY}</label>
            <textarea
              value={why}
              onChange={(e) => {
                setWhy(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder={UI_CONTENT.COMMITMENT.PLACEHOLDER_WHY}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all min-h-[120px] resize-none overflow-hidden"
            />
          </div>

          <button
            onClick={initiateCommitment}
            disabled={!selected || (selected === 'CUSTOM' && !customPath) || why.length < 10}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
          >
            {UI_CONTENT.COMMITMENT.BUTTON_COMMIT}
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
           <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-8 flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                 <h4 className="text-emerald-400 font-bold mb-1">{UI_CONTENT.COMMITMENT.LOCKED_TITLE}</h4>
                 <p className="text-sm text-slate-300 italic">"I have chosen: {selected === 'CUSTOM' ? customPath : selected.replace(/^[A-Z]:\s*/i, '')}"</p>
                 <p className="text-xs text-slate-500 mt-2">Reasoning: {why}</p>
              </div>
           </div>

           <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => onBranch(`Based on my previous decision to ${selected === 'CUSTOM' ? customPath : selected}, my next step is:`)}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 border border-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8.8a7 7 0 0 1-9 9.2z"/><path d="M22 22l-5-5"/><path d="M17 22l5-5"/></svg>
                {UI_CONTENT.COMMITMENT.BUTTON_BRANCH}
              </button>
              
              <button
                onClick={() => {
                  setIsCommitted(false);
                  if (selected === 'CUSTOM') setSelected('CUSTOM'); 
                }}
                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
              >
                {UI_CONTENT.COMMITMENT.BUTTON_REEVALUATE}
              </button>
           </div>
        </div>
      )}

      <MindfulCommitModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={finalConfirm}
        onConsult={() => { setIsModalOpen(false); onConsult(); }}
        coreInquiry={coreInquiry}
        selectedOption={selected === 'CUSTOM' ? customPath : selected.replace(/^[A-Z]:\s*/i, '')}
      />
    </div>
  );
};

export default CommitmentPanel;
