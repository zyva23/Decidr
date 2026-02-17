
import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { RadarMetrics } from '../types';

interface RadarVizProps {
  metrics: RadarMetrics;
}

const RadarViz: React.FC<RadarVizProps> = ({ metrics }) => {
  const data = [
    { subject: 'Risk', A: metrics.risk, fullMark: 100 },
    { subject: 'Speed', A: metrics.speed, fullMark: 100 },
    { subject: 'Cost', A: metrics.cost, fullMark: 100 },
    { subject: 'Impact', A: metrics.impact, fullMark: 100 },
  ];

  return (
    <div id="decision-radar-chart" className="h-64 w-full relative p-2 bg-slate-900/40 rounded-xl">
        <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider absolute top-0 left-0 p-2">Decision Profile</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="55%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Decision Score"
            dataKey="A"
            stroke="#818cf8"
            strokeWidth={2}
            fill="#6366f1"
            fillOpacity={0.4}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#818cf8' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarViz;
