import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts';

interface RadarVizProps {
  metrics?: {
    risk: number;
    speed: number;
    cost: number;
    impact: number;
    feasibility: number;
  };
}

const RadarViz: React.FC<RadarVizProps> = ({ metrics }) => {
  const [isMobile, setIsDesktop] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const data = metrics ? [
    { subject: 'Risk', A: metrics.risk, fullMark: 100 },
    { subject: 'Speed', A: metrics.speed, fullMark: 100 },
    { subject: 'Cost', A: metrics.cost, fullMark: 100 },
    { subject: 'Impact', A: metrics.impact, fullMark: 100 },
    { subject: 'Feasibility', A: metrics.feasibility, fullMark: 100 },
  ] : [];

  if (!metrics) return null;

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="85%" data={data}>
          <PolarGrid stroke="#334155" strokeWidth={1} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: isMobile ? 8 : 10, fontWeight: 'bold' }} 
          />
          <Radar
            name="Council Alignment"
            dataKey="A"
            stroke="#6366f1"
            strokeWidth={3}
            fill="#6366f1"
            fillOpacity={0.3}
          />
          {/* Only show legend on desktop, and position it to avoid clipping */}
          {!isMobile && (
            <Legend 
                verticalAlign="bottom" 
                align="center" 
                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarViz;
