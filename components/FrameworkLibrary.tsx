import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FrameworkLibrary: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Methodology Library</h2>
            <p className="text-slate-400 text-sm">Understanding the decision frameworks used by the Council</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-12">
          
          {/* Section 1: The Lenses */}
          <section>
            <h3 className="text-xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 9.94"/><path d="M9.69 8h11.48"/><path d="M7.38 12l5.74-9.94"/><path d="M9.69 16L3.95 6.06"/><path d="M14.31 16H2.83"/><path d="M16.62 12l-5.74 9.94"/></svg>
              The 4-Lens Framework
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-800/50 p-5 rounded-xl border border-blue-500/20">
                <h4 className="font-bold text-blue-300 mb-2">1. The Analyst (Quantitative)</h4>
                <p className="text-sm text-slate-300 mb-3">Based on Cost-Benefit Analysis (CBA) and Financial Modeling.</p>
                <ul className="text-xs text-slate-400 list-disc ml-4 space-y-1">
                  <li>Calculates ROI and Net Present Value.</li>
                  <li>Evaluates resource efficiency.</li>
                  <li>Prioritizes hard data over intuition.</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-5 rounded-xl border border-purple-500/20">
                <h4 className="font-bold text-purple-300 mb-2">2. The Strategist (Game Theory)</h4>
                <p className="text-sm text-slate-300 mb-3">Based on Competitive Strategy (Porter's 5 Forces) and Second-Order Thinking.</p>
                <ul className="text-xs text-slate-400 list-disc ml-4 space-y-1">
                  <li>Anticipates competitor reactions.</li>
                  <li>Evaluates market positioning and leverage.</li>
                  <li>Focuses on long-term differentiation.</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-5 rounded-xl border border-red-500/20">
                <h4 className="font-bold text-red-300 mb-2">3. The Skeptic (Pre-Mortem)</h4>
                <p className="text-sm text-slate-300 mb-3">Based on "Prospective Hindsight" techniques used by Klein and Kahneman.</p>
                <ul className="text-xs text-slate-400 list-disc ml-4 space-y-1">
                  <li>Assumes the project has already failed.</li>
                  <li>Works backward to find the cause of failure.</li>
                  <li>Identifies regulatory and catastrophic risks.</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-5 rounded-xl border border-emerald-500/20">
                <h4 className="font-bold text-emerald-300 mb-2">4. The Mediator (Human Capital)</h4>
                <p className="text-sm text-slate-300 mb-3">Based on Organizational Psychology and Stakeholder Theory.</p>
                <ul className="text-xs text-slate-400 list-disc ml-4 space-y-1">
                  <li>Evaluates impact on team morale and culture.</li>
                  <li>Considers ethical implications.</li>
                  <li>Manages alignment between disparate groups.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: Synthesis Engine */}
          <section>
             <h3 className="text-xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              Synthesis & Metrics
            </h3>
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/30 border border-indigo-500/20 rounded-xl p-6">
               <h4 className="font-bold text-white mb-4">The Radar Profile</h4>
               <p className="text-slate-300 text-sm mb-6">
                 The council does not just give a "Yes/No". It plots your decision on four competing axes to visualize the trade-offs involved.
               </p>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="text-center">
                   <div className="text-indigo-400 font-bold mb-1">Risk</div>
                   <div className="text-xs text-slate-500">Probability of failure or negative externalities.</div>
                 </div>
                 <div className="text-center">
                   <div className="text-indigo-400 font-bold mb-1">Speed</div>
                   <div className="text-xs text-slate-500">Time-to-value and implementation velocity.</div>
                 </div>
                 <div className="text-center">
                   <div className="text-indigo-400 font-bold mb-1">Cost</div>
                   <div className="text-xs text-slate-500">Financial and resource expenditure required.</div>
                 </div>
                 <div className="text-center">
                   <div className="text-indigo-400 font-bold mb-1">Impact</div>
                   <div className="text-xs text-slate-500">Magnitude of positive outcome if successful.</div>
                 </div>
               </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default FrameworkLibrary;
