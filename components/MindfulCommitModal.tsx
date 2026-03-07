import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onConsult: () => void;
  coreInquiry: string;
  selectedOption: string;
}

const MindfulCommitModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, onConsult, coreInquiry, selectedOption }) => {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(60);
      return;
    }

    if (timeLeft <= 0) {
      onConfirm();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-fade-in" />
      
      <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(99,102,241,0.2)] text-center animate-fade-in">
        
        {/* Mindful Breathing Graphic */}
        <div className="relative w-32 h-32 mx-auto mb-10">
           {/* Outer Ring (Exhale) */}
           <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full animate-[ping_4s_infinite]"></div>
           {/* Middle Ring (Pulse) */}
           <div className="absolute inset-4 border border-indigo-400/40 rounded-full animate-pulse"></div>
           {/* Inner Core (Inhale) */}
           <div className="absolute inset-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center">
              <span className="text-2xl font-black text-white tabular-nums">{timeLeft}</span>
           </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">The Interval of Intent</h2>
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Final Resonance Check</p>
        
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 mb-8 text-left space-y-4">
           <div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Core Inquiry</span>
              <p className="text-sm text-white font-medium line-clamp-2">{coreInquiry}</p>
           </div>
           <div className="pt-4 border-t border-slate-800/50">
              <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Chosen Path</span>
              <p className="text-sm text-indigo-300 font-bold">{selectedOption}</p>
           </div>
        </div>

        <p className="text-slate-400 text-xs mb-8 leading-relaxed italic">
          "Pause. Listen to your gut reaction. Does this choice feel true, or is there a lingering dissonance?"
        </p>

        <div className="space-y-4 pt-4">
           <button 
            onClick={onConfirm}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-900/20"
           >
             Proceed with Intent
           </button>

           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onConsult}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl border border-slate-700 transition-all text-xs uppercase tracking-widest"
              >
                Re-Consult Council
              </button>
              <button 
                onClick={onClose}
                className="py-3 bg-slate-800/50 hover:bg-red-900/20 text-slate-500 hover:text-red-400 font-bold rounded-xl border border-slate-800 transition-all text-xs uppercase tracking-widest"
              >
                Recalibrate
              </button>
           </div>
        </div>

        <p className="mt-8 text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">
          Automatic commitment in {timeLeft} seconds
        </p>
      </div>
    </div>
  );
};

export default MindfulCommitModal;
