import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DailyProgress } from '../lib/types';

interface Props {
  history: DailyProgress[];
  range: 7 | 14 | 30;
}

export function HistoryChart({ history, range }: Props) {
  const data = useMemo(() => {
    const days: { date: string; label: string }[] = [];
    const today = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: key,
        label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      });
    }
    return days.map((d) => {
      const found = history.find((h) => h.date === d.date);
      const hydPct = found ? (found.hydrationMl / Math.max(1, found.hydrationTargetMl)) * 100 : 0;
      const movPct = found ? (found.movementDone / Math.max(1, found.movementTarget)) * 100 : 0;
      return {
        date: d.label,
        Hydration: Math.round(hydPct),
        Movement: Math.round(movPct),
      };
    });
  }, [history, range]);

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(119,78,36,0.15)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6A381F', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(119,78,36,0.2)' }}
          />
          <YAxis
            tick={{ fill: '#6A381F', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(119,78,36,0.2)' }}
            domain={[0, 120]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              background: '#FFFFB3',
              border: '1px solid #774E24',
              borderRadius: 8,
              color: '#6A381F',
            }}
            formatter={(v: number) => `${v}%`}
          />
          <Legend wrapperStyle={{ color: '#6A381F', paddingTop: 8 }} />
          <Bar dataKey="Hydration" fill="#6E0D25" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Movement" fill="#DCAB6B" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
