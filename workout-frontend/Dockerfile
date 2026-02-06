# syntax=docker/dockerfile:1

# CI에서 미리 빌드된 dist/를 Nginx로 서빙
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# 기본 파일 제거
RUN rm -rf ./*

# 미리 빌드된 React 앱 복사 (CI에서 npm run build 완료된 상태)
COPY dist .

# Nginx 설정 복사
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# 헬스체크 엔드포인트 생성
RUN echo "OK" > /usr/share/nginx/html/health

# 포트 노출
EXPOSE 80 443

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
