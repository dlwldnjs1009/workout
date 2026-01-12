import { createTheme } from '@mui/material/styles';
import type { ThemeOptions, PaletteMode } from '@mui/material/styles';

// Design Tokens - Color Palette
const PALETTE = {
  // Primary Colors
  TOSS_BLUE: '#3182F6',
  TOSS_BLUE_LIGHT: '#5B9DF9',
  TOSS_BLUE_DARK: '#1B64DA',

  // Background Colors
  BG_LIGHT: '#F2F4F6',
  BG_DARK: '#101012',
  PAPER_LIGHT: '#FFFFFF',
  PAPER_DARK: '#191F28',

  // Text Colors
  TEXT_PRIMARY_LIGHT: '#191F28',
  TEXT_PRIMARY_DARK: '#FFFFFF',
  TEXT_SECONDARY: '#8B95A1',
  TEXT_DISABLED_LIGHT: '#B0B8C1',
  TEXT_DISABLED_DARK: '#4E5968',

  // Grey Scale
  GREY_50_LIGHT: '#F9FAFB',
  GREY_50_DARK: '#191F28',
  GREY_100_LIGHT: '#F2F4F6',
  GREY_100_DARK: '#242A35',
  GREY_200_LIGHT: '#E5E8EB',
  GREY_200_DARK: '#333D4B',
  GREY_300_LIGHT: '#D1D6DB',
  GREY_300_DARK: '#4E5968',
  GREY_400_LIGHT: '#B0B8C1',
  GREY_400_DARK: '#6B7684',
  GREY_500: '#8B95A1',
  GREY_600_LIGHT: '#6B7684',
  GREY_600_DARK: '#B0B8C1',
  GREY_700_LIGHT: '#4E5968',
  GREY_700_DARK: '#D1D6DB',
  GREY_800_LIGHT: '#333D4B',
  GREY_800_DARK: '#E5E8EB',
  GREY_900_LIGHT: '#191F28',
  GREY_900_DARK: '#F9FAFB',

  // Semantic Colors
  ERROR: '#F04452',
  SUCCESS: '#3182F6',
} as const;

// Toss-style sophisticated shadow system
const getShadows = (mode: PaletteMode) => ({
  sm: mode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 2px 8px rgba(0, 0, 0, 0.04)',
  md: mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.4)'
    : '0 4px 20px rgba(0, 0, 0, 0.05)',
  lg: mode === 'dark'
    ? '0 8px 30px rgba(0, 0, 0, 0.5)'
    : '0 8px 30px rgba(0, 0, 0, 0.08)',
  xl: mode === 'dark'
    ? '0 12px 40px rgba(0, 0, 0, 0.6)'
    : '0 12px 40px rgba(0, 0, 0, 0.12)',
  primary: mode === 'dark'
    ? '0 8px 24px rgba(49, 130, 246, 0.3)'
    : '0 8px 24px rgba(49, 130, 246, 0.25)',
  card: mode === 'dark'
    ? '0 4px 24px rgba(0, 0, 0, 0.4)'
    : '0 4px 24px rgba(0, 0, 0, 0.06)',
  float: mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.5)'
    : '0 8px 32px rgba(0, 0, 0, 0.12)',
});

const getDesignTokens = (mode: PaletteMode): ThemeOptions => {
  const shadows = getShadows(mode);
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,
      primary: {
        main: PALETTE.TOSS_BLUE,
        light: PALETTE.TOSS_BLUE_LIGHT,
        dark: PALETTE.TOSS_BLUE_DARK,
        contrastText: PALETTE.PAPER_LIGHT,
      },
      secondary: {
        main: isDark ? PALETTE.TEXT_DISABLED_LIGHT : PALETTE.GREY_800_LIGHT,
      },
      background: {
        default: isDark ? PALETTE.BG_DARK : PALETTE.BG_LIGHT,
        paper: isDark ? PALETTE.PAPER_DARK : PALETTE.PAPER_LIGHT,
      },
      text: {
        primary: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.TEXT_PRIMARY_LIGHT,
        secondary: PALETTE.TEXT_SECONDARY,
        disabled: isDark ? PALETTE.TEXT_DISABLED_DARK : PALETTE.TEXT_DISABLED_LIGHT,
      },
      grey: {
        50: isDark ? PALETTE.GREY_50_DARK : PALETTE.GREY_50_LIGHT,
        100: isDark ? PALETTE.GREY_100_DARK : PALETTE.GREY_100_LIGHT,
        200: isDark ? PALETTE.GREY_200_DARK : PALETTE.GREY_200_LIGHT,
        300: isDark ? PALETTE.GREY_300_DARK : PALETTE.GREY_300_LIGHT,
        400: isDark ? PALETTE.GREY_400_DARK : PALETTE.GREY_400_LIGHT,
        500: PALETTE.GREY_500,
        600: isDark ? PALETTE.GREY_600_DARK : PALETTE.GREY_600_LIGHT,
        700: isDark ? PALETTE.GREY_700_DARK : PALETTE.GREY_700_LIGHT,
        800: isDark ? PALETTE.GREY_800_DARK : PALETTE.GREY_800_LIGHT,
        900: isDark ? PALETTE.GREY_900_DARK : PALETTE.GREY_900_LIGHT,
      },
      error: {
        main: PALETTE.ERROR,
      },
      success: {
        main: PALETTE.SUCCESS,
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : PALETTE.BG_LIGHT,
    },
    typography: {
      fontFamily: [
        'Pretendard',
        '-apple-system',
        'BlinkMacSystemFont',
        'system-ui',
        'Roboto',
        '"Helvetica Neue"',
        '"Segoe UI"',
        '"Apple SD Gothic Neo"',
        '"Noto Sans KR"',
        '"Malgun Gothic"',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '24px',
        lineHeight: 1.4,
        letterSpacing: '-0.02em',
        color: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.TEXT_PRIMARY_LIGHT
      },
      h2: {
        fontWeight: 700,
        fontSize: '22px',
        lineHeight: 1.4,
        letterSpacing: '-0.02em',
        color: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.TEXT_PRIMARY_LIGHT
      },
      h3: {
        fontWeight: 700,
        fontSize: '20px',
        lineHeight: 1.4,
        letterSpacing: '-0.02em',
        color: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.TEXT_PRIMARY_LIGHT
      },
      h4: {
        fontWeight: 700,
        fontSize: '18px',
        lineHeight: 1.4,
        letterSpacing: '-0.02em',
        color: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.TEXT_PRIMARY_LIGHT
      },
      h5: {
        fontWeight: 600,
        fontSize: '17px',
        lineHeight: 1.4,
        letterSpacing: '-0.02em',
        color: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.TEXT_PRIMARY_LIGHT
      },
      h6: {
        fontWeight: 600,
        fontSize: '15px',
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
        color: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.TEXT_PRIMARY_LIGHT
      },
      subtitle1: {
        fontSize: '17px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: isDark ? PALETTE.GREY_800_DARK : PALETTE.GREY_800_LIGHT,
        lineHeight: 1.5
      },
      subtitle2: {
        fontSize: '15px',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        color: isDark ? PALETTE.TEXT_DISABLED_LIGHT : PALETTE.TEXT_DISABLED_DARK,
        lineHeight: 1.5
      },
      body1: {
        fontSize: '16px',
        color: isDark ? PALETTE.GREY_800_DARK : PALETTE.GREY_800_LIGHT,
        lineHeight: 1.6
      },
      body2: {
        fontSize: '14px',
        color: isDark ? PALETTE.TEXT_DISABLED_LIGHT : PALETTE.GREY_400_DARK,
        lineHeight: 1.5
      },
      caption: {
        fontSize: '12px',
        color: PALETTE.TEXT_SECONDARY,
        lineHeight: 1.4
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '15px',
        letterSpacing: '-0.01em',
      },
    },
    shape: {
      borderRadius: 20,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            padding: '12px 20px',
            fontSize: '16px',
            fontWeight: 600,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: 'none',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            }
          },
          containedPrimary: {
            backgroundColor: PALETTE.TOSS_BLUE,
            color: PALETTE.PAPER_LIGHT,
            boxShadow: shadows.primary,
            '&:hover': {
              backgroundColor: PALETTE.TOSS_BLUE_DARK,
              boxShadow: isDark
                ? '0 12px 28px rgba(49, 130, 246, 0.4)'
                : '0 12px 28px rgba(49, 130, 246, 0.35)',
            },
          },
          outlinedPrimary: {
            borderColor: PALETTE.TOSS_BLUE,
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: 'rgba(49, 130, 246, 0.08)',
            },
          },
          sizeLarge: {
            padding: '16px 28px',
            fontSize: '18px',
            borderRadius: '24px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '24px',
            boxShadow: shadows.card,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
            padding: '24px',
            backgroundColor: isDark ? PALETTE.PAPER_DARK : PALETTE.PAPER_LIGHT,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: '24px',
          },
          elevation0: {
            boxShadow: 'none',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
          },
          elevation1: {
            boxShadow: shadows.md,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
            backgroundColor: isDark ? PALETTE.PAPER_DARK : PALETTE.PAPER_LIGHT,
          },
          elevation2: {
            boxShadow: shadows.lg,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
            backgroundColor: isDark ? PALETTE.PAPER_DARK : PALETTE.PAPER_LIGHT,
          },
          elevation3: {
            boxShadow: shadows.xl,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
            backgroundColor: isDark ? PALETTE.PAPER_DARK : PALETTE.PAPER_LIGHT,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(16, 16, 18, 0.75)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.TEXT_PRIMARY_LIGHT,
            boxShadow: 'none',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              backgroundColor: isDark ? PALETTE.GREY_100_DARK : PALETTE.GREY_50_LIGHT,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover': {
                backgroundColor: isDark ? PALETTE.GREY_200_DARK : PALETTE.GREY_100_LIGHT,
              },
              '&:hover fieldset': {
                borderColor: 'transparent',
              },
              '&.Mui-focused': {
                backgroundColor: isDark ? PALETTE.PAPER_DARK : PALETTE.PAPER_LIGHT,
                boxShadow: `0 0 0 2px ${PALETTE.TOSS_BLUE} inset`,
              },
              '&.Mui-focused fieldset': {
                borderColor: 'transparent',
                borderWidth: 0,
              },
              '& input': {
                padding: '16px',
                fontWeight: 500,
                color: isDark ? PALETTE.TEXT_PRIMARY_DARK : PALETTE.GREY_800_LIGHT,
              }
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            fontWeight: 600,
            backgroundColor: isDark ? PALETTE.GREY_200_DARK : PALETTE.GREY_100_LIGHT,
            color: isDark ? PALETTE.TEXT_DISABLED_LIGHT : PALETTE.TEXT_DISABLED_DARK,
            border: 'none',
          },
          colorPrimary: {
            backgroundColor: 'rgba(49, 130, 246, 0.15)',
            color: PALETTE.TOSS_BLUE,
            '&:hover': {
              backgroundColor: 'rgba(49, 130, 246, 0.25)',
            }
          }
        }
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: '20px',
            paddingRight: '20px',
            '@media (min-width: 600px)': {
              paddingLeft: '24px',
              paddingRight: '24px',
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            height: 60,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: isDark ? PALETTE.GREY_400_DARK : PALETTE.TEXT_DISABLED_LIGHT,
            minWidth: 'auto',
            padding: '8px 12px',
            '&.Mui-selected': {
              color: PALETTE.TOSS_BLUE,
            },
          },
          label: {
            fontWeight: 600,
            fontSize: '11px',
            marginTop: '4px',
            letterSpacing: '-0.01em',
          }
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '24px',
            boxShadow: shadows.xl,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: '16px',
            boxShadow: shadows.lg,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
          },
        },
      },
    },
  };
};

export const getTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
