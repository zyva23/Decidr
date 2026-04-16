import React, { useState, useEffect } from 'react';

const agents = [
  { id: 'analyst', name: 'Analyst', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '📊' },
  { id: 'strategist', name: 'Strategist', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '🎯' },
  { id: 'skeptic', name: 'Skeptic', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '🛡️' },
  { id: 'mediator', name: 'Mediator', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '🤝' },
];

const messages = [
  { from: 'analyst', to: 'strategist', text: "Data points identified. ROI variance is significant." },
  { from: 'strategist', to: 'skeptic', text: "Pivoting strategy to mitigate market volatility." },
  { from: 'skeptic', to: 'analyst', text: "Historical failure modes haven't been accounted for." },
  { from: 'mediator', to: 'analyst', text: "Bridging quantitative data with stakeholder sentiment." },
  { from: 'analyst', to: 'mediator', text: "Feeding refined metrics into the consensus engine." },
  { from: 'strategist', to: 'mediator', text: "Strategic paths are converging. Ready for synthesis." },
];

const DeliberationAnimation: React.FC = () => {
  const [activeMessageIdx, setActiveMessageIdx] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<typeof messages>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessageIdx((prev) => (prev + 1) % messages.length);
      setVisibleMessages(prev => {
        const next = [...prev, messages[activeMessageIdx]];
        if (next.length > 4) return next.slice(1);
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeMessageIdx]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-3xl border border-slate-800/50 backdrop-blur-xl relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] bg-indigo-500/5 rounded-full animate-pulse blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-12">
        <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Council Deliberation</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Archetypes...</p>
        </div>

        {/* Agent Circle */}
        <div className="relative h-64 flex items-center justify-center">
          {agents.map((agent, i) => {
            const angle = (i * 360) / agents.length;
            const radius = 100;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            const isActive = messages[activeMessageIdx].from === agent.id || messages[activeMessageIdx].to === agent.id;

            return (
              <div
                key={agent.id}
                className="absolute transition-all duration-700"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                <div className={`flex flex-col items-center gap-2 ${isActive ? 'scale-110' : 'scale-90 opacity-50'} transition-all duration-500`}>
                  <div className={`w-14 h-14 rounded-2xl ${agent.bg} ${agent.border} border flex items-center justify-center text-2xl shadow-xl relative`}>
                    {agent.icon}
                    {isActive && (
                      <div className={`absolute inset-0 rounded-2xl border-2 ${agent.color.replace('text', 'border')} animate-ping opacity-40`}></div>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${agent.color}`}>{agent.name}</span>
                </div>
              </div>
            );
          })}

          {/* Connection Lines (Conceptual) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 bg-indigo-500/20 rounded-full shadow-[0_0_100px_40px_rgba(99,102,241,0.1)]"></div>
          </div>
        </div>

        {/* Transmission Log */}
        <div className="space-y-3">
          {visibleMessages.map((msg, i) => {
            const fromAgent = agents.find(a => a.id === msg.from)!;
            const toAgent = agents.find(a => a.id === msg.to)!;
            
            return (
              <div key={i} className="flex items-center gap-3 animate-slide-up opacity-0 [animation-fill-mode:forwards]">
                <div className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${fromAgent.bg} ${fromAgent.color}`}>
                  {fromAgent.name}
                </div>
                <div className="h-px flex-1 bg-slate-800 relative">
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-slate-700 rounded-full"></div>
                </div>
                <div className="text-[11px] text-slate-300 font-medium italic">"{msg.text}"</div>
                <div className="h-px w-4 bg-slate-800"></div>
                <div className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${toAgent.bg} ${toAgent.color}`}>
                  {toAgent.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DeliberationAnimation;
