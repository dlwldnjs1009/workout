import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todayfit.app',
  appName: 'TodayFit',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['todayfit.site'],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: false,
    },
  },
};

export default config;
