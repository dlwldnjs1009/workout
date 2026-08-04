import { memo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@mui/material';
import type { ExerciseProgressPoint } from '../types';

interface ExerciseOneRepMaxChartProps {
  data: ExerciseProgressPoint[];
}

const ExerciseOneRepMaxChart = ({ data }: ExerciseOneRepMaxChartProps) => {
  const theme = useTheme();
  const gridColor = theme.palette.mode === 'dark' ? '#333D4B' : '#f2f4f6';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          dy={12}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={42}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '14px',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
          formatter={(value) => [`${Number(value).toFixed(1)}kg`, '추정 1RM']}
          labelStyle={{ color: theme.palette.text.primary }}
        />
        <Line
          type="monotone"
          dataKey="estimatedOneRepMax"
          stroke="#3182F6"
          strokeWidth={3}
          dot={{ r: 3, fill: '#3182F6', stroke: theme.palette.background.paper, strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default memo(ExerciseOneRepMaxChart);
