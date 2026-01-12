import React, { memo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  height?: string | number;
}

const EmptyState = ({ icon, title, description, action, height = '300px' }: EmptyStateProps) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        textAlign: 'center',
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: '24px',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f2f4f6'}`,
      }}
    >
      {icon && (
        <Box 
          sx={{ 
            mb: 2, 
            color: 'text.secondary',
            p: 2.5,
            borderRadius: '50%',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            '& svg': {
              fontSize: '40px'
            }
          }}
        >
          {icon}
        </Box>
      )}
      
      <Typography variant="h6" fontWeight="700" color="text.primary" gutterBottom>
        {title}
      </Typography>
      
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 3 : 0, maxWidth: '280px', wordBreak: 'keep-all', mx: 'auto' }}>
          {description}
        </Typography>
      )}
      
      {action && (
        <Box sx={{ mt: 1 }}>
          {action}
        </Box>
      )}
    </Box>
  );
};

export default memo(EmptyState);
