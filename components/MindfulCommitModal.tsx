import React, { useState, useEffect } from 'react';
import { UI_CONTENT } from '../src/constants/uiContent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selected: string, why: string) => void;
  onConsult: () => void;
  coreInquiry: string;
  options: string;
  refinedPaths?: string[];
  initialCommitment?: { selectedOption: string; justification: string; };
}

const MindfulCommitModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onConsult, 
  coreInquiry, 
  options, 
  refinedPaths,
  initialCommitment 
}) => {
  const [step, setStep] = useState<'selection' | 'mindful'>('selection');
  const [selected, setSelected] = useState(initialCommitment?.selectedOption || '');
  const [customPath, setCustomPath] = useState('');
  const [why, setWhy] = useState(initialCommitment?.justification || '');
  const [timeLeft, setTimeLeft] = useState(60);

  const parseOptions = (text: string) => {
    const parts = text.split(/(?:\n|^)(?:Path\s+[A-Z]:|Option\s+\d+:|[A-Z]:|\d+\.|\*|•)\s*/i);
    return parts.map(p => p.trim()).filter(p => p.length > 5);
  };

  const optionList = (refinedPaths && refinedPaths.length > 0) 
    ? refinedPaths 
    : parseOptions(options);

  useEffect(() => {
    if (!isOpen) {
      setStep('selection');
      setTimeLeft(60);
      return;
    }

    if (step === 'mindful') {
      if (timeLeft <= 0) {
        const finalChoice = selected === 'CUSTOM' ? customPath : selected;
        onConfirm(finalChoice, why);
        return;
      }

      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, step, timeLeft, onConfirm, selected, customPath, why]);

  if (!isOpen) return null;

  const handleNext = () => {
    setStep('mindful');
  };

  const finalChoiceLabel = selected === 'CUSTOM' ? customPath : selected.replace(/^[A-Z]:\s*/i, '');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={onClose} />
      
      <div 
        role="dialog"
        className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(99,102,241,0.15)] overflow-hidden animate-fade-in"
      >
        {step === 'selection' ? (
          <div className="p-8 md:p-12 space-y-8">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Seal the Intent</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 
                   Final Strategic Commitment
                </p>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Select Your Path</label>
                <div className="grid grid-cols-1 gap-3">
                  {optionList.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(opt)}
                      className={`p-5 text-left rounded-2xl border transition-all ${
                        selected === opt 
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg' 
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-black opacity-50 mb-1 uppercase tracking-tighter">
                        {refinedPaths && refinedPaths.length > 0 ? "Council Recommendation" : `Proposed Option ${i+1}`}
                      </div>
                      <div className="text-sm font-bold leading-relaxed">{opt.replace(/^[A-Z]:\s*/i, '')}</div>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setSelected('CUSTOM')}
                    className={`p-5 text-left rounded-2xl border transition-all ${
                      selected === 'CUSTOM' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg' 
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-black opacity-50 mb-1 uppercase tracking-tighter">Divergent Synthesis</div>
                    <div className="text-sm font-bold">Something else...</div>
                  </button>
                </div>

                {selected === 'CUSTOM' && (
                  <div className="mt-4 animate-fade-in">
                    <input 
                      type="text"
                      value={customPath}
                      onChange={(e) => setCustomPath(e.target.value)}
                      placeholder="Describe your alternative path..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-5 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-inner placeholder-slate-600"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Internal Justification (The 'Why')</label>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder="Why does this path feel correct? What intuition or data point is the deciding factor?"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-5 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all min-h-[120px] resize-none shadow-inner"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!selected || (selected === 'CUSTOM' && !customPath) || why.length < 10}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-900/30 transition-all active:scale-95"
            >
              Initialize Interval of Intent
            </button>
          </div>
        ) : (
          <div className="p-8 md:p-16 text-center space-y-10">
            {/* Mindful Breathing Graphic */}
            <div className="relative w-40 h-40 mx-auto">
               <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full animate-[ping_4s_infinite]"></div>
               <div className="absolute inset-4 border border-indigo-400/40 rounded-full animate-pulse"></div>
               <div className="absolute inset-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center">
                  <span className="text-3xl font-black text-white tabular-nums">{timeLeft}</span>
               </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">The Mindful Interval</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto italic">
                  "Pause. Listen to your gut reaction. Does this choice feel true, or is there a lingering dissonance?"
                </p>
            </div>
            
            <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-8 text-left space-y-6">
               <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block opacity-50">Committed To</span>
                  <p className="text-md text-white font-bold leading-snug">{finalChoiceLabel}</p>
               </div>
               <div className="pt-6 border-t border-slate-800/50 space-y-1">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block opacity-50">Resonance Basis</span>
                  <p className="text-sm text-slate-300 italic">"{why}"</p>
               </div>
            </div>

            <div className="space-y-4">
               <button 
                onClick={() => onConfirm(selected === 'CUSTOM' ? customPath : selected, why)}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-900/30"
               >
                 Confirm with Intent
               </button>

               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={onConsult}
                    className="py-4 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl border border-slate-700 transition-all text-[10px] uppercase tracking-widest"
                  >
                    Re-Consult Council
                  </button>
                  <button 
                    onClick={() => setStep('selection')}
                    className="py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-500 hover:text-white font-bold rounded-xl border border-slate-800 transition-all text-[10px] uppercase tracking-widest"
                  >
                    Recalibrate Choice
                  </button>
               </div>
            </div>

            <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.3em]">
              Automatic SEAL in {timeLeft} seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindfulCommitModal;
