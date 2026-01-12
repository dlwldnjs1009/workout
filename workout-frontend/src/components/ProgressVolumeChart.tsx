import { memo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@mui/material';

interface ProgressVolumeChartProps {
  data: { date: string; volume: number }[];
}

const ProgressVolumeChart = ({ data }: ProgressVolumeChartProps) => {
  const theme = useTheme();
  const textColor = theme.palette.text.secondary;
  const gridColor = theme.palette.mode === 'dark' ? '#333D4B' : '#f2f4f6';
  const tooltipBg = theme.palette.background.paper;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
          dy={15}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: textColor, fontSize: 12 }}
          width={40}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '16px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '12px 16px',
            backgroundColor: tooltipBg
          }}
          itemStyle={{ color: '#F04452', fontWeight: 600, fontSize: '14px' }}
          cursor={{ stroke: gridColor, strokeWidth: 2 }}
          formatter={(value) => [`${Number(value).toLocaleString()} kg`, 'Volume']}
          labelStyle={{ color: theme.palette.text.primary }}
        />
        <Line
          type="monotone"
          dataKey="volume"
          stroke="#F04452"
          strokeWidth={3}
          dot={false}
          activeDot={{
            r: 6,
            fill: '#F04452',
            stroke: tooltipBg,
            strokeWidth: 3,
            style: { filter: 'drop-shadow(0 2px 4px rgba(240, 68, 82, 0.3))' }
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default memo(ProgressVolumeChart);
