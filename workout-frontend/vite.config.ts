import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
    // 청크 크기 경고 임계값 (kB)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 벤더 코드를 별도 청크로 분리하여 캐시 효율성 향상
        manualChunks: {
          // React 코어 라이브러리
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // MUI 라이브러리 (가장 큼)
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // 차트 라이브러리 (무거움)
          'chart-vendor': ['recharts'],
          // 폼 관련 라이브러리
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // 애니메이션 라이브러리
          'animation-vendor': ['framer-motion'],
          // 유틸리티
          'utils-vendor': ['date-fns', 'axios', 'zustand'],
        },
      },
    },
    // 소스맵 생성 (프로덕션 디버깅용, 필요시 false로 변경)
    sourcemap: false,
    // CSS 코드 분할
    cssCodeSplit: true,
    // 최소화 설정
    minify: 'esbuild',
    // 타겟 브라우저
    target: 'es2020',
  },
  // 의존성 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
});
