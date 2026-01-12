import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  color?: 'primary' | 'error';
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  color = 'primary'
}: ConfirmDialogProps) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: '24px', p: 1, minWidth: 320 }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pt: 3 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            borderRadius: '12px', 
            bgcolor: 'action.hover', 
            color: 'text.primary', 
            px: 3, 
            py: 1.5,
            fontWeight: 700,
            '&:hover': { bgcolor: 'action.selected' }
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={() => { onConfirm(); onClose(); }} 
          variant="contained" 
          color={color}
          sx={{ 
            borderRadius: '12px', 
            px: 3, 
            py: 1.5,
            fontWeight: 700,
            boxShadow: 'none'
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
