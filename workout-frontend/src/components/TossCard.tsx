import { Card } from '@mui/material';
import type { CardProps } from '@mui/material';
import React, { memo } from 'react';

interface TossCardProps extends CardProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const TossCard = ({ children, sx = {}, onClick, ...props }: TossCardProps) => (
  <Card
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => {
      // 카드 자체가 포커스됐을 때만 (내부 인터랙티브 요소 키 입력은 통과)
      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    } : undefined}
    sx={{
      transition: 'background-color 0.15s ease',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { bgcolor: 'action.hover' } : {},
      ...sx
    }}
    {...props}
  >
    {children}
  </Card>
);

export default memo(TossCard);
