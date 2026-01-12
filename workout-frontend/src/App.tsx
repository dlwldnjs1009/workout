import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, useMediaQuery, Box, Skeleton } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { useMemo, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { getTheme } from './theme';
import { useThemeStore } from './store/themeStore';

// 라우트 기반 코드 스플리팅 - 각 페이지를 별도 청크로 분리
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorkoutLog = lazy(() => import('./pages/WorkoutLog'));
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'));
const Routines = lazy(() => import('./pages/Routines'));
const Progress = lazy(() => import('./pages/Progress'));
const SessionDetail = lazy(() => import('./pages/SessionDetail'));
const DietLog = lazy(() => import('./pages/DietLog'));
const Settings = lazy(() => import('./pages/Settings'));
const WorkoutHistory = lazy(() => import('./pages/WorkoutHistory'));

// 페이지 로딩 스켈레톤
const PageLoader = () => (
  <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
    <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />
    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3 }} />
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Skeleton variant="rectangular" height={150} sx={{ flex: 1, borderRadius: 3 }} />
      <Skeleton variant="rectangular" height={150} sx={{ flex: 1, borderRadius: 3 }} />
    </Box>
  </Box>
);

import ScrollToTop from './components/ScrollToTop';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const { mode } = useThemeStore();
  
  const theme = useMemo(() => {
    let paletteMode: PaletteMode = 'light';
    
    if (mode === 'system') {
      paletteMode = prefersDarkMode ? 'dark' : 'light';
    } else {
      paletteMode = mode;
    }
    
    return getTheme(paletteMode);
  }, [mode, prefersDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/log-workout" element={<WorkoutLog />} />
              <Route path="/diet-log" element={<DietLog />} />
              <Route path="/exercises" element={<ExerciseLibrary />} />
              <Route path="/routines" element={<Routines />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/sessions/:id" element={<SessionDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/history" element={<WorkoutHistory />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
