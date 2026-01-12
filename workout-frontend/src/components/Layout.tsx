import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Container,
  useTheme,
  useMediaQuery,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Stack,
  Divider,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import CheckIcon from '@mui/icons-material/Check';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, type ThemeMode } from '../store/themeStore';
import { useScrollDirection } from '../hooks/useScrollDirection';

// Navigation Configuration
const MENU_ITEMS = [
  { text: '홈', icon: <DashboardIcon />, path: '/' },
  { text: '운동 기록', icon: <AddCircleOutlineIcon />, path: '/log-workout' },
  { text: '루틴', icon: <ListAltIcon />, path: '/routines' },
  { text: '식단 기록', icon: <RestaurantMenuIcon />, path: '/diet-log' },
  { text: '운동 종목', icon: <FitnessCenterIcon />, path: '/exercises' },
  { text: '진행 상황', icon: <ShowChartIcon />, path: '/progress' },
] as const;

const BOTTOM_NAV_ITEMS = [
  { text: '홈', icon: <HomeIcon />, path: '/' },
  { text: '기록', icon: <EditIcon />, path: '/log-workout' },
  { text: '루틴', icon: <ListAltIcon />, path: '/routines' },
  { text: '식단', icon: <RestaurantMenuIcon />, path: '/diet-log' },
  { text: '진행', icon: <ShowChartIcon />, path: '/progress' },
] as const;

// Sub-components

interface UserMenuProps {
  user: { username: string } | null;
  mode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onLogout: () => void;
  onNavigateToSettings: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, mode, onThemeChange, onLogout, onNavigateToSettings }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    handleClose();
    onNavigateToSettings();
  };

  const handleLogoutClick = () => {
    handleClose();
    onLogout();
  };

  if (!user) return null;

  return (
    <Box sx={{ ml: 'auto' }}>
      <IconButton
        onClick={handleMenu}
        sx={{
          p: 0.5,
          border: '2px solid transparent',
          transition: 'all 0.2s ease',
          '&:hover': {
            border: `2px solid ${theme.palette.divider}`,
            transform: 'scale(1.05)',
          }
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
          {user.username.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            boxShadow: isDark
              ? '0px 12px 40px rgba(0,0,0,0.5)'
              : '0px 12px 40px rgba(0,0,0,0.12)',
            minWidth: 240,
            borderRadius: '20px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
            backdropFilter: 'blur(20px)',
            bgcolor: isDark ? 'rgba(25, 31, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          }
        }}
      >
        <Box sx={{ px: 2, py: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>로그인된 사용자</Typography>
          <Typography variant="body1" fontWeight={700} color="text.primary">{user.username}</Typography>
        </Box>

        <MenuItem onClick={handleSettings} sx={{ py: 1.5, mx: 1, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ManageAccountsIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight={500} color="text.primary">설정</Typography>
          </Box>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            테마 설정
          </Typography>
          <Stack spacing={0.5}>
            <MenuItem
              onClick={() => onThemeChange('light')}
              sx={{
                borderRadius: '12px',
                py: 1,
                bgcolor: mode === 'light' ? 'rgba(49, 130, 246, 0.1)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LightModeIcon sx={{ fontSize: 20, color: mode === 'light' ? 'primary.main' : 'text.primary' }} />
                <Typography variant="body2" fontWeight={500} color="text.primary">라이트 모드</Typography>
              </Box>
              {mode === 'light' && <CheckIcon sx={{ fontSize: 18, color: 'primary.main' }} />}
            </MenuItem>

            <MenuItem
              onClick={() => onThemeChange('dark')}
              sx={{
                borderRadius: '12px',
                py: 1,
                bgcolor: mode === 'dark' ? 'rgba(49, 130, 246, 0.1)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DarkModeIcon sx={{ fontSize: 20, color: mode === 'dark' ? 'primary.main' : 'text.primary' }} />
                <Typography variant="body2" fontWeight={500} color="text.primary">다크 모드</Typography>
              </Box>
              {mode === 'dark' && <CheckIcon sx={{ fontSize: 18, color: 'primary.main' }} />}
            </MenuItem>

            <MenuItem
              onClick={() => onThemeChange('system')}
              sx={{
                borderRadius: '12px',
                py: 1,
                bgcolor: mode === 'system' ? 'rgba(49, 130, 246, 0.1)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SettingsBrightnessIcon sx={{ fontSize: 20, color: mode === 'system' ? 'primary.main' : 'text.primary' }} />
                <Typography variant="body2" fontWeight={500} color="text.primary">시스템 설정</Typography>
              </Box>
              {mode === 'system' && <CheckIcon sx={{ fontSize: 18, color: 'primary.main' }} />}
            </MenuItem>
          </Stack>
        </Box>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={handleLogoutClick} sx={{ py: 1.5, color: 'error.main', fontWeight: 600, mx: 1, borderRadius: '12px' }}>
          로그아웃
        </MenuItem>
      </Menu>
    </Box>
  );
};

interface FloatingBottomNavProps {
  scrollDirection: 'up' | 'down' | null;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({ scrollDirection, currentPath, onNavigate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <AnimatePresence>
      {scrollDirection !== 'down' && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring' as const, damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: 16,
            right: 16,
            zIndex: 1100,
          }}
        >
          <Box
            sx={{
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(25, 31, 40, 0.75)' : 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
                : '0 8px 32px rgba(0, 0, 0, 0.12)',
              overflow: 'hidden',
            }}
          >
            <BottomNavigation
              value={currentPath}
              onChange={(_, newValue) => {
                onNavigate(newValue);
              }}
              showLabels
              sx={{
                height: 64,
                bgcolor: 'transparent',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 'auto',
                  padding: '8px 0',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    '& .MuiSvgIcon-root': {
                      transform: 'scale(1.1)',
                    }
                  }
                }
              }}
            >
              {BOTTOM_NAV_ITEMS.map((item) => (
                <BottomNavigationAction
                  key={item.text}
                  label={item.text}
                  value={item.path}
                  icon={item.icon}
                />
              ))}
            </BottomNavigation>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Layout Component

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const scrollDirection = useScrollDirection();
  const isDark = theme.palette.mode === 'dark';

  const handleThemeChange = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default', pb: isMobile ? 14 : 0 }}>
      {/* Sticky Header with Enhanced Glassmorphism */}
      <AnimatePresence>
        {scrollDirection !== 'down' && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring' as const, damping: 25, stiffness: 300 }}
            style={{ position: 'sticky', top: 0, zIndex: 1200 }}
          >
            <AppBar
              position="static"
              color="inherit"
              elevation={0}
              sx={{
                bgcolor: isDark ? 'rgba(16, 16, 18, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.06)'
                  : '1px solid rgba(0, 0, 0, 0.04)',
              }}
            >
              <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ height: 60 }}>
                  {!isMobile && (
                    <Typography
                      variant="h5"
                      component="div"
                      sx={{
                        fontWeight: 800,
                        color: 'text.primary',
                        cursor: 'pointer',
                        letterSpacing: '-0.02em',
                        mr: 4
                      }}
                      onClick={() => navigate('/')}
                    >
                      Workout
                    </Typography>
                  )}

                  {isMobile && (
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        flexGrow: 1,
                        fontWeight: 700,
                        color: 'text.primary',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {BOTTOM_NAV_ITEMS.find(item => item.path === location.pathname)?.text || 'Workout'}
                    </Typography>
                  )}

                  {!isMobile && (
                    <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
                      {MENU_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Button
                            key={item.text}
                            color={isActive ? "primary" : "inherit"}
                            onClick={() => handleNavigate(item.path)}
                            startIcon={item.icon}
                            sx={{
                              fontWeight: isActive ? 700 : 500,
                              color: isActive ? 'primary.main' : 'text.secondary',
                              bgcolor: isActive ? 'rgba(49, 130, 246, 0.1)' : 'transparent',
                              borderRadius: '16px',
                              px: 2,
                              py: 1,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: isActive ? 'rgba(49, 130, 246, 0.15)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              }
                            }}
                          >
                            {item.text}
                          </Button>
                        );
                      })}
                    </Box>
                  )}

                  <UserMenu
                    user={user}
                    mode={mode}
                    onThemeChange={handleThemeChange}
                    onLogout={handleLogout}
                    onNavigateToSettings={() => navigate('/settings')}
                  />
                </Toolbar>
              </Container>
            </AppBar>
          </motion.div>
        )}
      </AnimatePresence>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 4, px: isMobile ? 2 : 3 }}>
        <Outlet />
      </Container>

      {/* Floating Dock Navigation */}
      {isMobile && (
        <FloatingBottomNav
          scrollDirection={scrollDirection}
          currentPath={location.pathname}
          onNavigate={handleNavigate}
        />
      )}
    </Box>
  );
};

export default Layout;
