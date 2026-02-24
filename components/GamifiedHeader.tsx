import React from 'react';

interface GamifiedHeaderProps {
  xp: number;
  level: number;
}

const GamifiedHeader: React.FC<GamifiedHeaderProps> = ({ xp, level }) => {
  const progress = Math.min((xp % 500) / 500 * 100, 100);
  
  const getRank = (lvl: number) => {
    if (lvl < 3) return "Novice";
    if (lvl < 7) return "Dilettante";
    if (lvl < 12) return "Philosopher";
    if (lvl < 20) return "Master of Reason";
    return "The Sage";
  };

  const rank = getRank(level);

  return (
    <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl shadow-inner group">
      {/* Rank Badge */}
      <div className="flex flex-col items-start min-w-[80px]">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Strategic Rank</span>
        <span className="text-xs font-black text-indigo-400 uppercase tracking-tight">{rank}</span>
      </div>

      {/* Energy Meter */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex justify-between w-full items-center gap-8">
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => {
                    const blockValue = (i + 1) * 20;
                    const isActive = progress >= blockValue;
                    return (
                        <div 
                            key={i} 
                            className={`w-3 h-4 rounded-sm transition-all duration-500 ${
                                isActive 
                                    ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]' 
                                    : 'bg-slate-800'
                            }`}
                        />
                    );
                })}
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded shadow-lg shadow-indigo-900/40">LVL {level}</span>
            </div>
        </div>
      </div>

      <div className="h-8 w-[1px] bg-slate-800 ml-2"></div>

      {/* XP Counter */}
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black text-slate-200 tabular-nums">{xp % 500} / 500</span>
        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">XP to next</span>
      </div>
    </div>
  );
};

export default GamifiedHeader;
