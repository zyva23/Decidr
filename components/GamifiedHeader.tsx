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
    <div className="flex items-center gap-2 md:gap-4 bg-slate-900/40 border border-slate-800/50 px-2 py-1 md:px-4 md:py-2 rounded-xl md:rounded-2xl shadow-inner group">
      {/* Rank Badge */}
      <div className="flex flex-col items-start min-w-[60px] md:min-w-[80px]">
        <span className="text-[6px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Strategic Rank</span>
        <span className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-tight truncate max-w-[70px] md:max-w-none">{rank}</span>
      </div>

      {/* Energy Meter (Segmented) */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5 md:gap-1">
            {[...Array(5)].map((_, i) => {
                const blockValue = (i + 1) * 20;
                const isActive = progress >= blockValue;
                return (
                    <div 
                        key={i} 
                        className={`w-1.5 h-3 md:w-3 md:h-4 rounded-[1px] md:rounded-sm transition-all duration-700 ${
                            isActive 
                                ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]' 
                                : 'bg-slate-800'
                        }`}
                    />
                );
            })}
        </div>
        <div className="flex items-center justify-center bg-indigo-600 px-1.5 py-0.5 rounded shadow-lg shadow-indigo-900/40">
            <span className="text-[8px] md:text-[10px] font-black text-white whitespace-nowrap">L {level}</span>
        </div>
      </div>

      <div className="hidden sm:block h-8 w-[1px] bg-slate-800 ml-1"></div>

      {/* XP Counter (Hidden on very small screens) */}
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-[10px] font-black text-slate-200 tabular-nums">{xp % 500} <span className="text-slate-600">/ 500</span></span>
        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Inquiry Progress</span>
      </div>
    </div>
  );
};

export default GamifiedHeader;
