import { useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessFeedbackProps {
  open: boolean;
  onClose?: () => void;
  message?: string;
}

const SuccessFeedback = ({ open, onClose, message = "저장 완료!" }: SuccessFeedbackProps) => {
  const theme = useTheme();

  useEffect(() => {
    if (open && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.7)' 
                : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(12px)',
            }}
          />
          
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 2,
            }}
          >
            <Box 
              sx={{ 
                position: 'relative',
                width: 100,
                height: 100,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  opacity: 0.2,
                  filter: 'blur(20px)',
                  zIndex: 0,
                }}
              />

              <Box
                component={motion.div}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 10,
                  delay: 0.1 
                }}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 10px 30px ${theme.palette.mode === 'dark' ? 'rgba(49, 130, 246, 0.4)' : 'rgba(49, 130, 246, 0.3)'}`,
                  zIndex: 1,
                }}
              >
                <svg width="40" height="40" viewBox="0 0 50 50">
                  <motion.path
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 25 L22 37 L40 13"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                  />
                </svg>
              </Box>
            </Box>

            <Typography 
              variant="h4" 
              fontWeight="800" 
              sx={{ 
                color: theme.palette.text.primary,
                textShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.05)',
                textAlign: 'center',
              }}
            >
              {message}
            </Typography>
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default SuccessFeedback;
