import React from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

interface ListRowProps {
  left?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}

const ListRow: React.FC<ListRowProps> = ({
  left,
  title,
  subtitle,
  right,
  onClick,
  divider = true,
  ariaLabel,
  sx,
}) => {
  const interactive = Boolean(onClick);

  return (
    <Box
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 56,
          px: 2.5,
          py: 2,
          bgcolor: 'background.paper',
          borderBottom: divider ? '1px solid' : 'none',
          borderColor: 'divider',
          cursor: interactive ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease',
          '&:hover': interactive ? { bgcolor: 'action.hover' } : undefined,
          '&:active': interactive ? { bgcolor: 'action.selected' } : undefined,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {left !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {left}
        </Box>
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {typeof title === 'string' ? (
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}
            noWrap
          >
            {title}
          </Typography>
        ) : (
          title
        )}
        {subtitle !== undefined && subtitle !== null && (
          typeof subtitle === 'string' ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25, lineHeight: 1.4 }}
              noWrap
            >
              {subtitle}
            </Typography>
          ) : (
            <Box sx={{ mt: 0.25 }}>{subtitle}</Box>
          )
        )}
      </Box>

      {right !== undefined && (
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {right}
        </Box>
      )}
    </Box>
  );
};

export default ListRow;
