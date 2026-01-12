import { useRef, useEffect, useCallback, memo } from 'react';
import { List } from 'react-window';
import type { ListImperativeAPI, RowComponentProps } from 'react-window';
import { Box, Typography, useTheme } from '@mui/material';

interface VerticalScrollSelectorProps {
  values: number[];
  selectedValue: number;
  onChange: (value: number) => void;
  itemHeight?: number;
  visibleItems?: number;
  suffix?: string;
}

// 아이템 컴포넌트 메모이제이션
interface ItemProps {
  value: number;
  isSelected: boolean;
  suffix: string;
  onClick: () => void;
}

const Item = memo(({ value, isSelected, suffix, onClick }: ItemProps) => (
  <Box
    onClick={onClick}
    sx={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isSelected ? 1 : 0.3,
      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
      transition: 'all 0.1s ease-out',
      cursor: 'pointer',
      fontWeight: isSelected ? 800 : 500,
      color: isSelected ? 'primary.main' : 'text.primary'
    }}
  >
    <Typography
      variant="h6"
      sx={{
        fontSize: isSelected ? '1.4rem' : '1.1rem',
        transition: 'font-size 0.1s',
        color: 'inherit',
        fontWeight: 'inherit'
      }}
    >
      {value}{suffix}
    </Typography>
  </Box>
));

Item.displayName = 'Item';

// Row component props
interface RowProps {
  values: number[];
  selectedValue: number;
  suffix: string;
  onChange: (value: number) => void;
  listRef: React.RefObject<ListImperativeAPI | null>;
}

// Row component for react-window v2
const Row = ({ index, style, values, selectedValue, suffix, onChange, listRef }: RowComponentProps<RowProps>) => {
  const value = values[index];
  return (
    <div style={style}>
      <Item
        value={value}
        isSelected={value === selectedValue}
        suffix={suffix}
        onClick={() => {
          onChange(value);
          listRef.current?.scrollToRow({ index, align: 'center', behavior: 'smooth' });
        }}
      />
    </div>
  );
};

const VerticalScrollSelector = ({
  values,
  selectedValue,
  onChange,
  itemHeight = 44,
  visibleItems = 5,
  suffix = ''
}: VerticalScrollSelectorProps) => {
  const listRef = useRef<ListImperativeAPI | null>(null);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef(selectedValue);
  const isUserScrolling = useRef(false);
  const theme = useTheme();

  const containerHeight = itemHeight * visibleItems;
  // center 정렬 시 오프셋 계산: (visibleItems - 1) / 2 * itemHeight
  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;

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
      // 정확히 일치하면 바로 반환
      if (diff === 0) break;
    }
    return closestIndex;
  }, [values]);

  // 초기 스크롤 위치 설정 및 selectedValue 변경 시 스크롤
  useEffect(() => {
    if (isUserScrolling.current) return;

    const index = findClosestIndex(selectedValue);

    // 마운트 직후에는 listRef가 없을 수 있으므로 약간의 지연 추가
    const scrollToValue = () => {
      if (listRef.current) {
        listRef.current.scrollToRow({ index, align: 'center', behavior: 'instant' });
      }
    };

    // 즉시 시도 + 지연 시도 (마운트 타이밍 이슈 대응)
    scrollToValue();
    const timer = setTimeout(scrollToValue, 50);
    return () => clearTimeout(timer);
  }, [selectedValue, findClosestIndex]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    isUserScrolling.current = true;
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round((scrollTop + centerOffset) / itemHeight);
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
  }, [values, itemHeight, selectedValue, onChange]);

  return (
    <Box sx={{ position: 'relative', height: containerHeight, overflow: 'hidden', width: '100%' }}>
      {/* Center Highlight */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 12,
          right: 12,
          height: itemHeight,
          transform: 'translateY(-50%)',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          borderRadius: '12px',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Top Gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: itemHeight * 1.5,
          background: `linear-gradient(to bottom, ${theme.palette.background.paper} 20%, transparent 100%)`,
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />

      {/* Bottom Gradient */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: itemHeight * 1.5,
          background: `linear-gradient(to top, ${theme.palette.background.paper} 20%, transparent 100%)`,
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />

      <List
        listRef={listRef}
        rowCount={values.length}
        rowHeight={itemHeight}
        rowComponent={Row}
        rowProps={{ values, selectedValue, suffix, onChange, listRef }}
        overscanCount={3}
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
};

export default memo(VerticalScrollSelector);
