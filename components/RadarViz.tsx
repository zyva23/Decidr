
import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { RadarMetrics } from '../types';

interface RadarVizProps {
  metrics?: RadarMetrics;
}

const RadarViz: React.FC<RadarVizProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 animate-pulse">
        <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-800 mb-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Mapping metrics...</span>
      </div>
    );
  }

  const data = [
    { subject: 'Risk', A: metrics.risk || 0, fullMark: 100 },
    { subject: 'Speed', A: metrics.speed || 0, fullMark: 100 },
    { subject: 'Cost', A: metrics.cost || 0, fullMark: 100 },
    { subject: 'Impact', A: metrics.impact || 0, fullMark: 100 },
    { subject: 'Feasibility', A: metrics.feasibility || 0, fullMark: 100 },
  ];

  return (
    <div id="decision-radar-chart" className="h-64 w-full relative p-2 bg-slate-900/40 rounded-xl overflow-visible">
        <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest absolute top-2 left-3 z-10">Decision Profile</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" strokeWidth={1} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Decision Score"
            dataKey="A"
            stroke="#6366f1"
            strokeWidth={3}
            fill="#818cf8"
            fillOpacity={0.6}
            isAnimationActive={true}
            animationDuration={1500}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
            cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarViz;
