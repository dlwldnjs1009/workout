# Stage 1: React 빌드
FROM node:20-alpine AS build
WORKDIR /app

# package 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# Stage 2: Nginx
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# 기본 파일 제거
RUN rm -rf ./*

# 빌드된 React 앱 복사
COPY --from=build /app/dist .

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
