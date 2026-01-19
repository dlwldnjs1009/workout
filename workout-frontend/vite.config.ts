import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
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
        // 벤더 코드를 세밀하게 분리하여 캐시 효율성 극대화
        manualChunks: (id) => {
          // node_modules의 외부 라이브러리만 분리
          if (id.includes('node_modules')) {
            // React 코어
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // MUI 관련 (가장 무거움 - 약 300KB gzip)
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            // 차트 라이브러리 (약 150KB gzip)
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // 애니메이션 (약 100KB gzip)
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // 폼 관련
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'vendor-forms';
            }
            // 상태 관리
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
            // 날짜/시간
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            // HTTP 클라이언트
            if (id.includes('axios')) {
              return 'vendor-http';
            }
            // 나머지 외부 라이브러리
            return 'vendor-misc';
          }
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
