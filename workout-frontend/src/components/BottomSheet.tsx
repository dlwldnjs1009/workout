import React from 'react';
import { Box, Paper, Typography, IconButton, Modal, Slide, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const BottomSheet = ({ open, onClose, children, title }: BottomSheetProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) {
    return (
        <Modal open={open} onClose={onClose} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper sx={{ width: 500, maxHeight: '80vh', overflow: 'auto', borderRadius: 4, p: 3, outline: 'none' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    {title && <Typography variant="h6" fontWeight="bold">{title}</Typography>}
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                {children}
            </Paper>
        </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          sx={{
            width: '100%',
            maxHeight: '85vh',
            overflow: 'auto',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            p: 3,
            outline: 'none',
            bgcolor: 'background.paper',
            pb: 6
          }}
        >
            <Box sx={{ width: 40, height: 4, bgcolor: 'grey.300', borderRadius: 2, mx: 'auto', mb: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                {title && <Typography variant="h6" fontWeight="bold">{title}</Typography>}
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Box>
            {children}
        </Paper>
      </Slide>
    </Modal>
  );
};

export default BottomSheet;
