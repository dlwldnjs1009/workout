import { memo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useTheme } from '@mui/material';

interface WeeklyWorkoutsChartProps {
  data: { name: string; workouts: number }[];
}

const WeeklyWorkoutsChart = ({ data }: WeeklyWorkoutsChartProps) => {
  const theme = useTheme();
  const textColor = theme.palette.text.secondary;
  const tooltipBg = theme.palette.background.paper;
  const cursorFill = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f2f4f6';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: textColor, fontSize: 12 }}
          dy={10}
        />
        <Tooltip
          cursor={{ fill: cursorFill }}
          contentStyle={{
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backgroundColor: tooltipBg,
            color: theme.palette.text.primary
          }}
          labelStyle={{ color: theme.palette.text.primary }}
        />
        <Bar
          dataKey="workouts"
          fill="#3182F6"
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default memo(WeeklyWorkoutsChart);
