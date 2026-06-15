import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface ToastContextValue {
  showToast: (message: string, severity?: AlertColor) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message: string, severity: AlertColor = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const handleClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
