import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Paper, Link } from '@mui/material';
import { authService } from '../services/authService';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { useAuthStore } from '../store/authStore';

const registerSchema = z.object({
  username: z.string()
    .min(1, '아이디를 입력해 주세요.')
    .min(3, '아이디는 3~50자로 입력해 주세요.')
    .max(50, '아이디는 3~50자로 입력해 주세요.'),
  email: z.string()
    .min(1, '이메일을 입력해 주세요.')
    .email('올바른 이메일 형식이 아니에요.'),
  password: z.string()
    .min(8, '비밀번호는 8자 이상이어야 해요.')
    .max(100, '비밀번호는 100자 이하로 입력해 주세요.')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      '영문·숫자·특수문자를 모두 포함해야 해요.'
    ),
  confirmPassword: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요.')
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않아요.',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      const response = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password
      });
      const user = {
        id: response.id,
        username: response.username,
        email: response.email,
        createdAt: new Date().toISOString()
      };
      setAuth(user, response.token);
      navigate('/');
    } catch (err: unknown) {
      // 백엔드 유효성 검증 에러(필드별)는 해당 입력칸 아래에 인라인으로 표시
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === 'username' || field === 'email' || field === 'password') {
            setFieldError(field, { message });
          }
        });
        setError('입력한 정보를 다시 확인해 주세요.');
      } else {
        // 아이디/이메일 중복 등 비즈니스 에러는 백엔드 메시지를 그대로 노출
        setError(getErrorMessage(err));
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
              회원가입
            </Typography>
            <Typography variant="body1" color="text.secondary">
                우리와 함께 운동 여정을 추적해 보세요.
            </Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="아이디"
                  autoComplete="username"
                  autoFocus
                  error={!!errors.username}
                  helperText={errors.username?.message ?? '3~50자로 입력해 주세요'}
                  {...register('username')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="이메일"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  {...register('email')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  required
                  fullWidth
                  label="비밀번호"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message ?? '8자 이상, 영문·숫자·특수문자를 모두 포함'}
                  {...register('password')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  required
                  fullWidth
                  label="비밀번호 확인"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
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
              회원가입
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                이미 아이디가 있으십니까?{' '}
                <Link component={RouterLink} to="/login" fontWeight="600" underline="hover" color="primary">
                  로그인
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
