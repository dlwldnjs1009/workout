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
