import { memo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material';
import type { VolumeDataPoint } from '../types';

interface DashboardVolumeChartProps {
  data: VolumeDataPoint[];
}

const DashboardVolumeChart = ({ data }: DashboardVolumeChartProps) => {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F04452" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#F04452" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 500 }}
          dy={15}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            padding: '12px 16px',
            backgroundColor: theme.palette.background.paper
          }}
          itemStyle={{ color: '#F04452', fontWeight: 600, fontSize: '14px' }}
          cursor={{ stroke: theme.palette.divider, strokeWidth: 2 }}
          labelStyle={{ color: theme.palette.text.primary }}
        />
        <Area
          type="monotone"
          dataKey="volume"
          name="Volume"
          stroke="#F04452"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorVolume)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default memo(DashboardVolumeChart);
