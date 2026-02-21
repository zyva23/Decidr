import React from 'react';

interface GamifiedHeaderProps {
  xp: number;
  level: number;
}

const GamifiedHeader: React.FC<GamifiedHeaderProps> = ({ xp, level }) => {
  const xpToNextLevel = level * 500;
  const progress = Math.min((xp % 500) / 500 * 100, 100);
  
  const getRank = (lvl: number) => {
    if (lvl < 3) return "Observer";
    if (lvl < 7) return "Junior Analyst";
    if (lvl < 12) return "Strategist";
    if (lvl < 20) return "Council Member";
    return "Council Chairperson";
  };

  const rank = getRank(level);

  return (
    <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
      <div className="flex justify-between w-full items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{rank}</span>
        <span className="text-[10px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded ml-2">LVL {level}</span>
      </div>
      
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-shimmer transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
        {xp % 500} / 500 XP TO NEXT RANK
      </div>
    </div>
  );
};

export default GamifiedHeader;
