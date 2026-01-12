import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

// 백엔드 ErrorResponse 타입 정의
export interface ApiErrorResponse {
  code: string;
  message: string;
  status: number;
  timestamp: string;
  errors?: Record<string, string>;
}

// 에러 타입 체크 헬퍼
export const isApiError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
  return axios.isAxiosError(error) && error.response?.data?.code !== undefined;
};

// 에러 메시지 추출 헬퍼
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.response?.data?.message || '알 수 없는 오류가 발생했습니다.';
  }
  if (axios.isAxiosError(error)) {
    return error.message || '네트워크 오류가 발생했습니다.';
  }
  return '알 수 없는 오류가 발생했습니다.';
};

// 필드 에러 추출 헬퍼 (유효성 검증 에러용)
export const getFieldErrors = (error: unknown): Record<string, string> | null => {
  if (isApiError(error) && error.response?.data?.errors) {
    return error.response.data.errors;
  }
  return null;
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    // 토큰 만료 또는 인증 실패
    if (status === 401) {
      const currentPath = window.location.pathname;
      // 로그인 페이지가 아닌 경우에만 로그아웃 처리
      if (currentPath !== '/login' && currentPath !== '/register') {
        useAuthStore.getState().logout();
        // 리다이렉트는 라우터에서 처리
      }
    }

    // 에러 로깅 (개발 환경)
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${status} - ${errorCode}: ${error.response?.data?.message}`);
    }

    return Promise.reject(error);
  }
);

export default api;
