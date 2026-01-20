import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react()],
  // 프로덕션에서만 console.log 제거 (개발 모드에서는 유지)
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  build: {
    // 청크 크기 경고 임계값 상향 (kB)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 벤더 코드 분리 (함수 형태는 의존성 순환 문제 발생, 객체 형태 사용)
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-utils': ['date-fns', 'axios', 'zustand'],
        },
      },
    },
    // 소스맵 비활성화 (프로덕션 번들 크기 감소)
    sourcemap: false,
    // CSS 코드 분할 활성화
    cssCodeSplit: true,
    // esbuild minify (빠르고 효율적)
    minify: 'esbuild',
    // 타겟 브라우저 (최신 브라우저 타겟팅)
    target: 'es2020',
  },
  // 의존성 사전 번들링 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'zustand',
      'axios',
    ],
    // 제외할 의존성 (필요시 추가)
    exclude: [],
  },
}));
