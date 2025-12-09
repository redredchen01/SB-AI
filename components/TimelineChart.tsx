import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Scene } from '../types';

interface TimelineChartProps {
  scenes: Scene[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ scenes }) => {
  const data = scenes.map((s, i) => ({
    name: `S${i + 1}`,
    duration: s.duration,
    bgm: s.bgm,
    narration: s.narration
  }));

  return (
    <div className="h-40 w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">節奏分析 (單鏡頭秒數)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px', borderRadius: '8px' }}
            formatter={(value: number) => [`${value} 秒`, '持續時間']}
            labelFormatter={(label) => `鏡頭 ${label}`}
          />
          <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.duration > 10 ? '#3b82f6' : '#6366f1'} />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineChart;
