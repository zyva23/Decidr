import React, { useState, useEffect } from 'react';

const agents = [
  { id: 'analyst', name: 'Analyst', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '📊', angle: 0 },
  { id: 'strategist', name: 'Strategist', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '🎯', angle: 90 },
  { id: 'skeptic', name: 'Skeptic', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '🛡️', angle: 180 },
  { id: 'mediator', name: 'Mediator', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '🤝', angle: 270 },
];

const messages = [
  { from: 'analyst', to: 'strategist', text: "Data points identified. ROI variance is significant." },
  { from: 'human', to: 'analyst', text: "Grounding analysis in Human Strategic Insight..." },
  { from: 'strategist', to: 'skeptic', text: "Pivoting strategy to mitigate market volatility." },
  { from: 'skeptic', to: 'mediator', text: "Aligning agent perspectives with peer intelligence..." },
  { from: 'human', to: 'mediator', text: "Synthesizing human nuances with agent archetypes." },
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
        if (next.length > 3) return next.slice(1);
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [activeMessageIdx]);

  const currentMsg = messages[activeMessageIdx];
  
  const fromAgent = currentMsg.from === 'human' 
    ? { id: 'human', angle: 0, x: 0, y: 0 } // Center
    : agents.find(a => a.id === currentMsg.from)!;
    
  const toAgent = currentMsg.to === 'human'
    ? { id: 'human', angle: 0, x: 0, y: 0 } // Center
    : agents.find(a => a.id === currentMsg.to)!;

  const radius = 110;
  const getPos = (agent: any) => {
    if (!agent || agent.id === 'human') return { x: 0, y: 0 };
    const angle = agent.angle !== undefined ? agent.angle : 0;
    return {
        x: Math.cos((angle * Math.PI) / 180) * radius,
        y: Math.sin((angle * Math.PI) / 180) * radius
    };
  };

  const fromPos = getPos(fromAgent);
  const toPos = getPos(toAgent);

  const allAgents = [...agents, { id: 'human', name: 'Human', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: '🧠', angle: 0 }];

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-3xl border border-slate-800/50 backdrop-blur-xl relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] bg-indigo-500/5 rounded-full animate-pulse blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-10">
        <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Deliberation</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Council Deliberation</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Synchronizing Archetypes...</p>
        </div>

        {/* Agent Circle & Flow */}
        <div className="relative h-72 flex items-center justify-center">
          {/* SVG Connection Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="-150 -150 300 300">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="rgba(99, 102, 241, 0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            
            {/* Active Flow Line */}
            <line 
                x1={fromPos.x} y1={fromPos.y} 
                x2={toPos.x} y2={toPos.y} 
                stroke="url(#flowGradient)" 
                strokeWidth="4" 
                strokeDasharray="8,4"
                className="animate-[dash_1s_linear_infinite]"
            />
            
            {/* Arrow Head */}
            <circle cx={toPos.x} cy={toPos.y} r="3" fill="#6366f1" className="animate-ping" />
          </svg>

          {/* Central Human Hub */}
          <div className="absolute z-20 flex flex-col items-center justify-center">
             <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-2xl flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(99,102,241,0.3)] animate-pulse relative">
                🧠
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-[ping_3s_ease-in-out_infinite]"></div>
             </div>
             <span className="mt-2 text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">Intelligence Core</span>
          </div>

          {agents.map((agent) => {
            const { x, y } = getPos(agent);
            const isActive = currentMsg.from === agent.id || currentMsg.to === agent.id;
            const isSpeaking = currentMsg.from === agent.id;

            return (
              <div
                key={agent.id}
                className="absolute transition-all duration-700"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div className={`flex flex-col items-center gap-2 ${isActive ? 'scale-110' : 'scale-90 opacity-40'} transition-all duration-500`}>
                  <div className={`w-16 h-16 rounded-2xl ${agent.bg} ${agent.border} border flex items-center justify-center text-2xl shadow-xl relative`}>
                    {agent.icon}
                    {isSpeaking && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${agent.color}`}>{agent.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transmission Log */}
        <div className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50 min-h-[160px] flex flex-col justify-center">
          {visibleMessages.map((msg, i) => {
            const fA = allAgents.find(a => a.id === msg.from) || allAgents[0];
            const tA = allAgents.find(a => a.id === msg.to) || allAgents[0];
            const isLast = i === visibleMessages.length - 1;
            
            return (
              <div key={i} className={`flex items-center gap-3 animate-slide-up ${isLast ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${fA.bg} ${fA.color}`}>
                  {fA.name}
                </div>
                <div className="flex-1 text-[11px] text-slate-300 font-medium italic">
                    {msg.text}
                </div>
                <div className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${tA.bg} ${tA.color}`}>
                  {tA.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -24; }
        }
      `}</style>
    </div>
  );
};

export default DeliberationAnimation;
