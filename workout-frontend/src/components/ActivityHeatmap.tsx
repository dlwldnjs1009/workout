import { useRef, useEffect, useMemo, memo } from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import { format, addDays, parseISO, getDay } from 'date-fns';

interface ActivityHeatmapProps {
  startDate: string;
  levels: number[];
  onClick?: (date: string, level: number) => void;
}

const ActivityHeatmap = ({ startDate, levels, onClick }: ActivityHeatmapProps) => {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const baseDate = useMemo(() => parseISO(startDate), [startDate]);
  const startDayOfWeek = useMemo(() => getDay(baseDate), [baseDate]);
  
  const days = useMemo(() => levels.map((level, index) => ({
    date: addDays(baseDate, index),
    level
  })), [baseDate, levels]);
  
  const paddedDays = useMemo(() => Array(startDayOfWeek).fill(null).concat(days), [startDayOfWeek, days]);
  
  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < paddedDays.length; i += 7) {
      result.push(paddedDays.slice(i, i + 7));
    }
    return result;
  }, [paddedDays]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const getColor = (level: number) => {
    const isDark = theme.palette.mode === 'dark';
    switch (level) {
      case 0: return isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f4f6';
      case 1: return isDark ? 'rgba(49, 130, 246, 0.3)' : '#E5F0FF';
      case 2: return '#3182F6';
      case 3: return '#1b64da';
      default: return isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f4f6';
    }
  };

  return (
    <Box 
      ref={scrollRef}
      sx={{ 
      width: '100%', 
      overflowX: 'auto', 
      pb: 1,
      '&::-webkit-scrollbar': { height: '6px' },
      '&::-webkit-scrollbar-track': { background: 'transparent' },
      '&::-webkit-scrollbar-thumb': { background: theme.palette.mode === 'dark' ? '#333D4B' : '#dde0e5', borderRadius: '3px' }
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: '4px',
        justifyContent: 'space-between',
        minWidth: '100%',
        width: 'max-content',
        pb: 1 
      }}>
        {weeks.map((week, wIndex) => (
          <Box key={wIndex} sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {week.map((day: any, dIndex: number) => {
              if (!day) return <Box key={`empty-${dIndex}`} sx={{ width: 14, height: 14 }} />;
              
              const level = day.level;
              const dateStr = format(day.date, 'yyyy-MM-dd');
              
              return (
                <Tooltip 
                  key={dateStr}
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block' }}>
                        {format(day.date, 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                        Level {level}
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: 'background.paper',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: 'text.primary',
                        borderRadius: '12px',
                        p: 1,
                        border: `1px solid ${theme.palette.divider}`
                      }
                    },
                    arrow: {
                      sx: {
                        color: 'background.paper',
                        '&::before': {
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: 'background.paper',
                            boxSizing: 'border-box'
                        }
                      }
                    }
                  }}
                >
                  <Box 
                    onClick={() => onClick?.(dateStr, level)}
                    sx={{ 
                      width: 14, 
                      height: 14, 
                      borderRadius: '3px', 
                      bgcolor: getColor(level),
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      '&:hover': {
                         transform: 'scale(1.2)',
                         zIndex: 1,
                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }
                    }} 
                  />
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default memo(ActivityHeatmap);

// export default ActivityHeatmap;
