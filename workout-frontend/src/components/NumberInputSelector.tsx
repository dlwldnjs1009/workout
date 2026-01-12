import { useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Grid } from 'react-window';
import type { GridImperativeAPI, CellComponentProps } from 'react-window';
import { Box, Typography, useTheme } from '@mui/material';
import VerticalScrollSelector from './VerticalScrollSelector';

// 아이템 컴포넌트 메모이제이션
interface HorizontalItemProps {
  value: number;
  isSelected: boolean;
  suffix: string;
  onClick: () => void;
}

const HorizontalItem = memo(({ value, isSelected, suffix, onClick }: HorizontalItemProps) => (
  <Box
    onClick={onClick}
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isSelected ? 1 : 0.3,
      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
      transition: 'all 0.1s ease-out',
      cursor: 'pointer',
      fontWeight: isSelected ? 800 : 500,
      color: isSelected ? 'primary.main' : 'text.primary'
    }}
  >
    <Typography
      variant="h6"
      sx={{
        fontSize: isSelected ? '1.3rem' : '1rem',
        transition: 'font-size 0.1s',
        color: 'inherit',
        fontWeight: 'inherit'
      }}
    >
      {value}{suffix}
    </Typography>
  </Box>
));

HorizontalItem.displayName = 'HorizontalItem';

// Cell component props for Grid
interface CellProps {
  values: number[];
  selectedValue: number;
  suffix: string;
  onChange: (value: number) => void;
  gridRef: React.RefObject<GridImperativeAPI | null>;
}

// Cell component for react-window v2 Grid (horizontal)
const Cell = ({ columnIndex, style, values, selectedValue, suffix, onChange, gridRef }: CellComponentProps<CellProps>) => {
  const value = values[columnIndex];
  return (
    <div style={style}>
      <HorizontalItem
        value={value}
        isSelected={value === selectedValue}
        suffix={suffix}
        onClick={() => {
          onChange(value);
          gridRef.current?.scrollToCell({ columnIndex, columnAlign: 'center', rowIndex: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

interface HorizontalScrollSelectorProps {
  values: number[];
  selectedValue: number;
  onChange: (value: number) => void;
  itemWidth?: number;
  suffix?: string;
}

export const HorizontalScrollSelector = memo(({
  values,
  selectedValue,
  onChange,
  itemWidth = 70,
  suffix = ''
}: HorizontalScrollSelectorProps) => {
  const gridRef = useRef<GridImperativeAPI | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef(selectedValue);
  const isUserScrolling = useRef(false);
  const theme = useTheme();

  const containerHeight = 70;

  // 값에 가장 가까운 인덱스 찾기 (부동소수점 비교 문제 해결)
  const findClosestIndex = useCallback((targetValue: number) => {
    let closestIndex = 0;
    let minDiff = Math.abs(values[0] - targetValue);
    for (let i = 1; i < values.length; i++) {
      const diff = Math.abs(values[i] - targetValue);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
      if (diff === 0) break;
    }
    return closestIndex;
  }, [values]);

  // 초기 스크롤 위치 설정 및 selectedValue 변경 시 스크롤
  useEffect(() => {
    if (isUserScrolling.current) return;

    const index = findClosestIndex(selectedValue);

    const scrollToValue = () => {
      if (gridRef.current) {
        gridRef.current.scrollToCell({ columnIndex: index, columnAlign: 'center', rowIndex: 0, behavior: 'instant' });
      }
    };

    scrollToValue();
    const timer = setTimeout(scrollToValue, 50);
    return () => clearTimeout(timer);
  }, [selectedValue, findClosestIndex]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    isUserScrolling.current = true;
    const scrollLeft = e.currentTarget.scrollLeft;
    const containerWidth = containerRef.current?.offsetWidth || 300;
    
    const centerOffset = (containerWidth - itemWidth) / 2;
    const index = Math.round((scrollLeft + centerOffset) / itemWidth);
    const clampedIndex = Math.max(0, Math.min(values.length - 1, index));
    const value = values[clampedIndex];

    if (value !== undefined) {
      pendingValueRef.current = value;
    }

    // 스크롤 종료 감지 후 onChange 호출
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      isUserScrolling.current = false;
      if (pendingValueRef.current !== selectedValue) {
        onChange(pendingValueRef.current);
      }
    }, 150);
  }, [values, itemWidth, selectedValue, onChange]);

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: containerHeight, overflow: 'hidden' }}>
      {/* Center Highlight */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: 8,
          bottom: 8,
          width: itemWidth,
          transform: 'translateX(-50%)',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          borderRadius: '12px',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Left Gradient */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '20%',
          background: `linear-gradient(to right, ${theme.palette.background.paper} 0%, transparent 100%)`,
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />

      {/* Right Gradient */}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '20%',
          background: `linear-gradient(to left, ${theme.palette.background.paper} 0%, transparent 100%)`,
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />

      <Grid
        gridRef={gridRef}
        rowCount={1}
        rowHeight={containerHeight}
        columnCount={values.length}
        columnWidth={itemWidth}
        cellComponent={Cell}
        cellProps={{ values, selectedValue, suffix, onChange, gridRef }}
        overscanCount={5}
        onScroll={handleScroll}
        style={{
          height: containerHeight,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      />
    </Box>
  );
});

HorizontalScrollSelector.displayName = 'HorizontalScrollSelector';

interface NumberInputSelectorProps {
  value: number;
  onChange: (value: number) => void;
  type: 'integer' | 'decimal';
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

const NumberInputSelector = ({
  value,
  onChange,
  type,
  min = 0,
  max = 100,
  step = 1,
  suffix = ''
}: NumberInputSelectorProps) => {
  const values = useMemo(() => {
    const arr = [];
    for (let i = min; i <= max; i += step) {
      arr.push(Math.round(i * 100) / 100);
    }
    return arr;
  }, [min, max, step]);

  if (type === 'integer') {
    return (
      <VerticalScrollSelector
        values={values}
        selectedValue={value}
        onChange={onChange}
        suffix={suffix}
      />
    );
  }

  return (
    <HorizontalScrollSelector
      values={values}
      selectedValue={value}
      onChange={onChange}
      suffix={suffix}
    />
  );
};

export default memo(NumberInputSelector);
