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
    sx={{
      transition: 'all 0.2s ease',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: (theme) => theme.palette.mode === 'dark' 
          ? '0 15px 35px rgba(0,0,0,0.4)'
          : '0 15px 35px rgba(0,0,0,0.1)',
      } : {},
      ...sx
    }}
    {...props}
  >
    {children}
  </Card>
);

export default memo(TossCard);
