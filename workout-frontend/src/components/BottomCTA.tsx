import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

interface BottomCTAProps {
  children: React.ReactNode;
  /**
   * FloatingBottomNav가 페이지에 렌더링되는지 여부.
   * true면 BottomCTA는 Nav 위쪽으로 스택(bottom: 96px + safe-area).
   * false면 하단에 더 가깝게 붙음(bottom: 16px + safe-area).
   */
  stackAboveBottomNav?: boolean;
}

/**
 * 페이지 하단 고정 CTA. 긴 폼/목록에서 주요 액션이 스크롤로 사라지지 않도록.
 * 모바일 전용 — 데스크톱에서는 페이지 내부 레이아웃으로 충분.
 */
const BottomCTA: React.FC<BottomCTAProps> = ({ children, stackAboveBottomNav = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: stackAboveBottomNav ? 'calc(96px + env(safe-area-inset-bottom))' : 0,
        zIndex: 1099, // FloatingBottomNav(1100)보다 아래 → 시각적 스택은 위지만 겹침 발생 시 Nav 우선
        px: 2,
        pt: 1.5,
        pb: stackAboveBottomNav ? 1.5 : 'calc(16px + env(safe-area-inset-bottom))',
        background: isDark
          ? 'linear-gradient(to top, rgba(16,16,18,1) 60%, rgba(16,16,18,0))'
          : 'linear-gradient(to top, rgba(255,255,255,1) 60%, rgba(255,255,255,0))',
        pointerEvents: 'none',
        '& > *': { pointerEvents: 'auto' },
      }}
    >
      {children}
    </Box>
  );
};

export default BottomCTA;
