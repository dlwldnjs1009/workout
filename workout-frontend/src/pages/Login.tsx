import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Paper, Link, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setErrorDetail(null);
      setDetailOpen(false);
      const response = await authService.login(data);
      const user = {
        id: response.id,
        username: response.username,
        email: response.email,
        createdAt: new Date().toISOString()
      };
      setAuth(user, response.token);
      navigate('/');
    } catch (err: unknown) {
      const errorInfo = err as {
        message?: string;
        response?: { status?: number; statusText?: string; data?: unknown };
        code?: string;
        config?: { baseURL?: string; url?: string };
      };
      const status = errorInfo.response?.status;
      const message = status === 401 || status === 403
        ? '아이디 또는 비밀번호가 일치하지 않아요. 다시 확인해 주세요.'
        : typeof status === 'number' && status >= 500
          ? '일시적으로 서버와 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
          : '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
      setError(message);
      if (import.meta.env.DEV) {
        setErrorDetail(JSON.stringify({
          message: errorInfo.message,
          status,
          statusText: errorInfo.response?.statusText,
          data: errorInfo.response?.data,
          code: errorInfo.code,
          url: `${errorInfo.config?.baseURL ?? ''}${errorInfo.config?.url ?? ''}`,
        }, null, 2));
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 5, 
            width: '100%', 
            borderRadius: 4,
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.05)'
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography component="h1" variant="h4" fontWeight="800" gutterBottom color="text.primary">
              환영합니다!
            </Typography>
            <Typography variant="body1" color="text.secondary">
                로그인하려면 정보를 입력해 주세요.
            </Typography>
          </Box>
          
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2, cursor: errorDetail ? 'pointer' : 'default' }}
              onClick={errorDetail ? () => setDetailOpen(true) : undefined}
            >
              {error}{errorDetail ? ' — 개발자 모드: 탭하여 상세 보기' : ''}
            </Alert>
          )}

          <Dialog
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            PaperProps={{
              sx: { borderRadius: '24px', p: 1, minWidth: 320, maxWidth: '90vw' }
            }}
          >
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pt: 3 }}>
              에러 상세
            </DialogTitle>
            <DialogContent>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  p: 2,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '50vh',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {errorDetail}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button
                onClick={() => setDetailOpen(false)}
                variant="contained"
                sx={{ px: 3, py: 1.5, fontWeight: 700 }}
              >
                닫기
              </Button>
            </DialogActions>
          </Dialog>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="Id"
                  autoComplete="username"
                  autoFocus
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  {...register('username')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register('password')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 4, mb: 3, height: 56, fontSize: '1.1rem' }}
              disabled={isSubmitting}
            >
              로그인
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                계정이 없으십니까?{' '}
                <Link component={RouterLink} to="/register" fontWeight="600" underline="hover" color="primary">
                  회원가입
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
