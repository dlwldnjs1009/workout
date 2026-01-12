# 🚀 Workout 애플리케이션 Docker & CI/CD 전환 가이드

## 📋 목차

1. [개요](#개요)
2. [기존 환경 정리](#기존-환경-정리)
3. [Docker 환경 구축](#docker-환경-구축)
4. [CI/CD 파이프라인 설정](#cicd-파이프라인-설정)
5. [배포 및 운영](#배포-및-운영)

---

## 개요

### 전환 목표
- ❌ **Before**: JAR 파일, React 빌드 파일 수동 배포, 로컬 MySQL/Nginx 설정
- ✅ **After**: Docker Compose 기반 컨테이너화, GitHub Actions 자동 배포

### 주요 개선사항
1. **컨테이너화**: 모든 서비스를 Docker 컨테이너로 실행
2. **자동화**: GitHub에 Push하면 자동으로 빌드 및 배포
3. **안정성**: 헬스체크, 자동 재시작, 데이터 백업

---

## 기존 환경 정리

### 1. 실행 중인 애플리케이션 중단

```bash
# Spring Boot 애플리케이션 중단
# PID 확인
ps aux | grep java | grep workout

# 프로세스 종료 (PID를 실제 번호로 교체)
kill -9 <PID>

# 또는 systemd 서비스로 실행 중이라면
sudo systemctl stop workout-backend
sudo systemctl disable workout-backend
```

### 2. Nginx 설정 백업 및 제거

```bash
# 기존 Nginx 설정 백업
sudo cp /etc/nginx/sites-available/default /home/ubuntu/backup_nginx_config_$(date +%Y%m%d).conf
sudo cp /etc/nginx/nginx.conf /home/ubuntu/backup_nginx_main_$(date +%Y%m%d).conf

# Nginx 중단 (Docker로 대체할 예정이므로 선택사항)
sudo systemctl stop nginx
sudo systemctl disable nginx

# 완전히 제거하려면 (선택사항 - Docker Nginx 사용 시)
# sudo apt remove nginx nginx-common -y
```

### 3. MySQL 데이터베이스 백업

```bash
# 기존 데이터베이스 전체 백업
sudo mysqldump -u root -p workout > /home/ubuntu/workout_backup_$(date +%Y%m%d_%H%M%S).sql

# 백업 파일 압축
gzip /home/ubuntu/workout_backup_*.sql

# 백업 확인
ls -lh /home/ubuntu/workout_backup_*.sql.gz
```

### 4. MySQL 서비스 중단

```bash
# MySQL 중단 (Docker MySQL로 대체)
sudo systemctl stop mysql
sudo systemctl disable mysql

# 완전히 제거하려면 (선택사항)
# sudo apt remove mysql-server mysql-client -y
# sudo apt autoremove -y
```

### 5. 기존 애플리케이션 파일 정리

```bash
# 작업 디렉토리 생성
mkdir -p /home/ubuntu/old_deployment

# 기존 JAR 파일 이동
mv /home/ubuntu/*.jar /home/ubuntu/old_deployment/ 2>/dev/null || true

# 기존 React 빌드 파일 이동
mv /var/www/html/workout-frontend /home/ubuntu/old_deployment/ 2>/dev/null || true

# systemd 서비스 파일 백업
sudo cp /etc/systemd/system/workout-backend.service /home/ubuntu/old_deployment/ 2>/dev/null || true
```

### 6. 포트 사용 확인

```bash
# 사용 중인 포트 확인
sudo netstat -tulpn | grep -E ':(80|443|3306|8080)'

# 또는
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3306
sudo lsof -i :8080

# 프로세스가 남아있다면 종료
sudo kill -9 <PID>
```

---

## Docker 환경 구축

### 1. Docker 설치

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 로그아웃 후 재로그인 또는
newgrp docker

# Docker 버전 확인
docker --version
```

### 2. Docker Compose 설치

```bash
# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 실행 권한 부여
sudo chmod +x /usr/local/bin/docker-compose

# 버전 확인
docker-compose --version
```

### 3. 프로젝트 디렉토리 구조 생성

```bash
# 애플리케이션 디렉토리 생성
mkdir -p /home/ubuntu/workout-app
cd /home/ubuntu/workout-app

# 필요한 하위 디렉토리 생성
mkdir -p backups logs ssl mysql/conf scripts

# 디렉토리 구조 확인
tree -L 2
```

---

## 설정 파일 생성

### 1. Docker Compose 설정

**파일: `docker-compose.prod.yml`**

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    container_name: workout-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: workout
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      TZ: Asia/Seoul
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/conf/my.cnf:/etc/mysql/conf.d/my.cnf:ro
    # [MODIFIED] 운영: 외부 3306 오픈 금지 (필요하면 로컬만 바인딩)
    ports:
      - "127.0.0.1:3306:3306"
    networks:
      - workout-network
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u${MYSQL_USER} -p${MYSQL_PASSWORD} || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  backend:
    image: ghcr.io/${GITHUB_USERNAME}/workout-backend:latest
    container_name: workout-backend
    restart: always
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/workout?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD}

      SPRING_JPA_HIBERNATE_DDL_AUTO: update
      SPRING_JPA_SHOW_SQL: "false"

      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: "86400000"

      SERVER_PORT: "8080"
      SPRING_PROFILES_ACTIVE: prod
    # [MODIFIED] 운영: 8080 외부 오픈 안 해도 됨(프론트가 프록시)
    ports:
      - "127.0.0.1:8080:8080"
    networks:
      - workout-network
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8080/actuator/health | grep -q UP"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  frontend:
    image: ghcr.io/${GITHUB_USERNAME}/workout-frontend:latest
    container_name: workout-frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "80:80"
      # [MODIFIED] HTTPS 안 쓰면 일단 주석 추천
      - "443:443"
    networks:
      - workout-network
    volumes:
      # SSL 쓸 때만 인증서 넣기
      - ./ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost/health | grep -q OK"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 15s

networks:
  workout-network:
    driver: bridge

volumes:
  mysql_data:
    driver: local

```

### 2. 백엔드 Dockerfile

**파일: `Dockerfile` (프로젝트 루트)**

```dockerfile
# 멀티 스테이지 빌드로 이미지 크기 최적화

# Stage 1: 빌드
FROM gradle:8.5-jdk17 AS build
WORKDIR /app

# Gradle 파일 복사
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# 의존성 다운로드 (캐시 레이어)
RUN gradle dependencies --no-daemon

# 소스 코드 복사
COPY src ./src

# 애플리케이션 빌드
RUN gradle clean build -x test --no-daemon

# Stage 2: 실행 환경
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 보안을 위한 non-root 사용자 생성
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# 빌드 스테이지에서 JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 포트 노출
EXPOSE 8080

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# 애플리케이션 실행
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

### 3. 프론트엔드 Dockerfile

**파일: `workout-frontend/Dockerfile`**

```dockerfile
# 멀티 스테이지 빌드

# Stage 1: React 빌드
FROM node:20-alpine AS build
WORKDIR /app

# package 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

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
```

### 4. Nginx 설정

**파일: `workout-frontend/nginx/default.conf`**

```nginx
# Gzip 압축 활성화
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
gzip_disable "msie6";

# 백엔드 업스트림
upstream backend {
    server workout-backend:8080;
}

# 메인 서버 블록
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 업로드 파일 크기 제한
    client_max_body_size 10M;

    # React 빌드 파일 루트
    root /usr/share/nginx/html;
    index index.html;

    # 헬스체크 엔드포인트
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # API 프록시 (Spring Boot 백엔드)
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;

        # 프록시 헤더 설정
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 타임아웃
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 버퍼링
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # 정적 파일 캐싱
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router 지원 - 모든 경로를 index.html로
    location / {
        try_files $uri $uri/ /index.html;

        # index.html 캐싱 비활성화
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            expires 0;
        }
    }

    # 에러 페이지
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}

# HTTPS 서버 블록 (SSL 인증서 설정 후 주석 해제)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name your-domain.com;
#
#     ssl_certificate /etc/nginx/ssl/cert.pem;
#     ssl_certificate_key /etc/nginx/ssl/key.pem;
#
#     # SSL 설정
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#
#     # 위의 location 블록들을 여기에도 포함
# }
```

### 5. 환경 변수 설정

**파일: `.env`**

```bash
# MySQL 설정
MYSQL_ROOT_PASSWORD=your_secure_root_password_here_change_this
MYSQL_USER=workout_user
MYSQL_PASSWORD=your_secure_password_here_change_this

# GitHub 사용자명 (docker-compose용)
GITHUB_USERNAME=your_github_username

# JWT 시크릿 (최소 256비트)
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_minimum_256_bits_please_change_this

# 애플리케이션 프로필
SPRING_PROFILES_ACTIVE=prod
```

**보안 주의사항:**
```bash
# .env 파일 권한 설정
chmod 600 .env

# Git에 커밋하지 않도록 .gitignore에 추가
echo ".env" >> .gitignore
```

### 6. MySQL 커스텀 설정

**파일: `mysql/conf/my.cnf`**

```ini
[mysqld]
# 문자셋 설정
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 시간대 설정
default-time-zone='+09:00'

# 성능 튜닝
max_connections=100
innodb_buffer_pool_size=256M
innodb_log_file_size=64M

# 로깅
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow-query.log
long_query_time=2

# 바이너리 로깅 (백업용)
log_bin=/var/log/mysql/mysql-bin.log
expire_logs_days=7
max_binlog_size=100M

[client]
default-character-set=utf8mb4
```

---

## CI/CD 파이프라인 설정

### 1. GitHub Actions 워크플로우

**파일: `.github/workflows/deploy.yml`**

```yaml
name: OCI 서버에 빌드 및 배포

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  BACKEND_IMAGE_NAME: ${{ github.repository }}-backend
  FRONTEND_IMAGE_NAME: ${{ github.repository }}-frontend

jobs:
  build-and-push:
    name: Docker 이미지 빌드
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: 저장소 체크아웃
        uses: actions/checkout@v4

      - name: GitHub Container Registry 로그인
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 백엔드 메타데이터 추출
        id: meta-backend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: 백엔드 이미지 빌드 및 푸시
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta-backend.outputs.tags }}
          labels: ${{ steps.meta-backend.outputs.labels }}

      - name: 프론트엔드 메타데이터 추출
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: 프론트엔드 이미지 빌드 및 푸시
        uses: docker/build-push-action@v5
        with:
          context: ./workout-frontend
          file: ./workout-frontend/Dockerfile
          push: true
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}

  deploy:
    name: OCI 서버에 배포
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      - name: SSH를 통한 OCI 배포
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.OCI_HOST }}
          username: ${{ secrets.OCI_USERNAME }}
          key: ${{ secrets.OCI_SSH_PRIVATE_KEY }}
          port: 22
          script: |
            # 배포 디렉토리로 이동
            cd /home/ubuntu/workout-app

            # GitHub Container Registry 로그인
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin

            # 최신 이미지 풀
            docker pull ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE_NAME }}:latest
            docker pull ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE_NAME }}:latest

            # 기존 컨테이너 중단 및 제거
            docker-compose -f docker-compose.prod.yml down

            # 새 컨테이너 시작
            docker-compose -f docker-compose.prod.yml up -d

            # 사용하지 않는 이미지 정리
            docker image prune -af

            # 컨테이너 상태 확인
            docker-compose -f docker-compose.prod.yml ps

            # 로그 확인
            docker-compose -f docker-compose.prod.yml logs --tail=50

      - name: 헬스체크
        run: |
          echo "서비스 시작 대기 중..."
          sleep 30

          # 서비스 응답 확인
          curl -f http://${{ secrets.OCI_HOST }}/health || exit 1
          curl -f http://${{ secrets.OCI_HOST }}/api/health || exit 1

          echo "배포 성공!"
```

### 2. GitHub Secrets 설정

GitHub 저장소 설정에서 다음 Secrets를 추가하세요:

1. **저장소 > Settings > Secrets and variables > Actions**
2. **New repository secret** 클릭
3. 다음 항목들을 추가:

| Secret 이름 | 설명 | 예시 |
|------------|------|------|
| `OCI_HOST` | OCI 서버 IP 주소 | `123.45.67.89` |
| `OCI_USERNAME` | SSH 사용자명 | `ubuntu` |
| `OCI_SSH_PRIVATE_KEY` | SSH 개인 키 전체 내용 | `-----BEGIN RSA PRIVATE KEY-----...` |

> **참고**: `GITHUB_TOKEN`은 GitHub Actions가 자동으로 제공하므로 추가할 필요 없습니다.

### 3. SSH 키 생성 (필요한 경우)

```bash
# 로컬 머신에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key

# 공개 키를 OCI 서버에 추가
ssh-copy-id -i ~/.ssh/github_actions_key.pub ubuntu@your-server-ip

# 개인 키 내용 확인 (GitHub Secret에 추가)
cat ~/.ssh/github_actions_key
```

---

## 데이터베이스 마이그레이션

### 1. 기존 MySQL 데이터 복원

```bash
# Docker MySQL 컨테이너가 실행 중인지 확인
docker ps | grep workout-mysql

# 백업 파일 압축 해제 (필요한 경우)
gunzip /home/ubuntu/workout_backup_*.sql.gz

# Docker MySQL에 데이터 복원
docker exec -i workout-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} workout < /home/ubuntu/workout_backup_*.sql

# 복원 확인
docker exec -it workout-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} -e "USE workout; SHOW TABLES;"
```

### 2. 데이터베이스 연결 테스트

```bash
# 백엔드 컨테이너에서 데이터베이스 연결 확인
docker exec -it workout-backend curl http://localhost:8080/actuator/health

# MySQL 직접 접속
docker exec -it workout-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} workout
```

---

## 운영 스크립트

### 1. 데이터베이스 백업 스크립트

**파일: `scripts/backup_db.sh`**

```bash
#!/bin/bash

##############################################
# MySQL 데이터베이스 백업 스크립트
# 용도: Docker 컨테이너에서 MySQL 백업을 호스트로
# 사용법: ./backup_db.sh
##############################################

set -e  # 에러 발생 시 중단

# 설정
CONTAINER_NAME="workout-mysql"
DB_NAME="workout"
BACKUP_DIR="/home/ubuntu/workout-app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/workout_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=7  # 백업 보관 기간 (일)

# 출력 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 색상 리셋

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}데이터베이스 백업 시작...${NC}"

# 컨테이너 실행 확인
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}에러: MySQL 컨테이너 '${CONTAINER_NAME}'가 실행 중이 아닙니다!${NC}"
    exit 1
fi

# 환경 변수 로드
if [ -f /home/ubuntu/workout-app/.env ]; then
    source /home/ubuntu/workout-app/.env
else
    echo -e "${RED}에러: .env 파일을 찾을 수 없습니다!${NC}"
    exit 1
fi

# 백업 수행
echo -e "${YELLOW}백업 생성 중: ${BACKUP_FILE}${NC}"
docker exec "${CONTAINER_NAME}" mysqldump \
    -u"${MYSQL_USER}" \
    -p"${MYSQL_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "${DB_NAME}" > "${BACKUP_FILE}"

# 백업 압축
echo -e "${YELLOW}백업 압축 중...${NC}"
gzip "${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# 백업 크기 확인
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

echo -e "${GREEN}✓ 백업 완료!${NC}"
echo -e "${GREEN}  파일: ${BACKUP_FILE}${NC}"
echo -e "${GREEN}  크기: ${BACKUP_SIZE}${NC}"

# 오래된 백업 삭제 (보관 기간 초과)
echo -e "${YELLOW}오래된 백업 정리 중 (최근 ${RETENTION_DAYS}일 보관)...${NC}"
find "${BACKUP_DIR}" -name "workout_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# 최근 백업 목록
echo -e "${YELLOW}최근 백업 파일:${NC}"
ls -lh "${BACKUP_DIR}" | tail -5

echo -e "${GREEN}백업 프로세스 완료!${NC}"
```

### 2. 자동 백업 설정 (Cron)

**파일: `scripts/setup_backup_cron.sh`**

```bash
#!/bin/bash

##############################################
# Cron을 사용한 자동 백업 설정
# 사용법: sudo ./setup_backup_cron.sh
##############################################

SCRIPT_DIR="/home/ubuntu/workout-app/scripts"
LOG_FILE="/home/ubuntu/workout-app/logs/backup.log"

# 로그 디렉토리 생성
mkdir -p /home/ubuntu/workout-app/logs

# 백업 스크립트 실행 권한 부여
chmod +x "${SCRIPT_DIR}/backup_db.sh"

# Cron 작업 (매일 새벽 2시 실행)
CRON_JOB="0 2 * * * ${SCRIPT_DIR}/backup_db.sh >> ${LOG_FILE} 2>&1"

# Cron 작업이 이미 있는지 확인
if crontab -l 2>/dev/null | grep -q "backup_db.sh"; then
    echo "백업 Cron 작업이 이미 존재합니다."
else
    (crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -
    echo "✓ 백업 Cron 작업이 성공적으로 추가되었습니다!"
    echo "매일 새벽 2시에 데이터베이스가 백업됩니다."
fi

# 현재 Cron 작업 목록 표시
echo ""
echo "현재 Cron 작업:"
crontab -l
```

### 3. 스크립트 권한 설정

```bash
# 스크립트 실행 권한 부여
chmod +x /home/ubuntu/workout-app/scripts/backup_db.sh
chmod +x /home/ubuntu/workout-app/scripts/setup_backup_cron.sh

# 자동 백업 설정 실행
sudo /home/ubuntu/workout-app/scripts/setup_backup_cron.sh
```

---

## 배포 및 운영

### 1. 초기 배포

```bash
# 1. 저장소로 이동
cd /home/ubuntu/workout-app

# 2. 환경 변수 설정 확인
cat .env

# 3. 이미지 수동 빌드 (선택사항)
# docker-compose -f docker-compose.prod.yml build

# 4. 컨테이너 시작
docker-compose -f docker-compose.prod.yml up -d

# 5. 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

### 2. 자동 배포 (GitHub Actions)

```bash
# 로컬에서 코드 변경 후
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main

# GitHub Actions가 자동으로 실행됩니다:
# 1. Docker 이미지 빌드
# 2. GitHub Container Registry에 푸시
# 3. OCI 서버에 SSH 접속
# 4. 이미지 풀 및 컨테이너 재시작
```

### 3. 상태 확인 명령어

```bash
# 모든 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 실시간 로그 보기
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그만 보기
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f mysql

# 컨테이너 리소스 사용량
docker stats

# 헬스체크
curl http://localhost/health
curl http://localhost/api/health
curl http://localhost:8080/actuator/health
```

### 4. 일반적인 운영 작업

```bash
# 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart

# 특정 서비스만 재시작
docker-compose -f docker-compose.prod.yml restart backend

# 컨테이너 중단
docker-compose -f docker-compose.prod.yml stop

# 컨테이너 시작
docker-compose -f docker-compose.prod.yml start

# 컨테이너 완전 제거 (데이터는 유지됨)
docker-compose -f docker-compose.prod.yml down

# 컨테이너와 볼륨 모두 제거 (⚠️ 데이터 삭제됨!)
docker-compose -f docker-compose.prod.yml down -v
```

### 5. 수동 백업 및 복원

```bash
# 수동 백업
/home/ubuntu/workout-app/scripts/backup_db.sh

# 백업 파일 목록 확인
ls -lh /home/ubuntu/workout-app/backups/

# 백업 복원
gunzip -c /home/ubuntu/workout-app/backups/workout_backup_YYYYMMDD_HHMMSS.sql.gz | \
docker exec -i workout-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} workout
```

---

## 문제 해결

### 1. 컨테이너가 시작되지 않을 때

```bash
# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs

# 컨테이너 재생성
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### 2. 데이터베이스 연결 오류

```bash
# MySQL 컨테이너 접속
docker exec -it workout-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD}

# 환경 변수 확인
docker exec workout-backend env | grep -i mysql

# 네트워크 확인
docker network ls
docker network inspect workout-network
```

### 3. 포트 충돌

```bash
# 포트 사용 확인
sudo netstat -tulpn | grep -E ':(80|443|3306|8080)'

# 프로세스 종료
sudo kill -9 <PID>

# 또는 Docker Compose 포트 변경
# docker-compose.prod.yml에서 포트 매핑 수정
```

### 4. 디스크 공간 부족

```bash
# Docker 디스크 사용량 확인
docker system df

# 사용하지 않는 리소스 정리
docker system prune -a

# 볼륨 정리 (⚠️ 데이터 삭제 주의!)
docker volume prune
```

### 5. 이미지 업데이트가 반영되지 않을 때

```bash
# 캐시 없이 이미지 다시 풀
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## 보안 체크리스트

### 1. 환경 변수 보안

```bash
# .env 파일 권한 확인
ls -la .env

# 600으로 설정 (소유자만 읽기/쓰기)
chmod 600 .env

# Git에서 제외 확인
grep -q ".env" .gitignore && echo "OK" || echo ".env를 .gitignore에 추가하세요"
```

### 2. 방화벽 설정

```bash
# UFW 방화벽 활성화
sudo ufw enable

# 필요한 포트만 열기
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 방화벽 상태 확인
sudo ufw status
```

### 3. 패스워드 강도 확인

```bash
# 강력한 패스워드 생성
openssl rand -base64 32

# .env 파일의 패스워드 업데이트
nano .env
```

### 4. 정기 업데이트

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 이미지 업데이트
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## SSL/HTTPS 설정 (선택사항)

### 1. Let's Encrypt 인증서 발급

```bash
# Certbot 설치
sudo apt install certbot -y

# 인증서 발급 (도메인이 있는 경우)
sudo certbot certonly --standalone -d your-domain.com

# 인증서 위치 확인
ls -la /etc/letsencrypt/live/your-domain.com/
```

### 2. 인증서를 Docker로 복사

```bash
# SSL 디렉토리에 복사
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /home/ubuntu/workout-app/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /home/ubuntu/workout-app/ssl/key.pem

# 권한 설정
sudo chown -R ubuntu:ubuntu /home/ubuntu/workout-app/ssl
chmod 644 /home/ubuntu/workout-app/ssl/cert.pem
chmod 600 /home/ubuntu/workout-app/ssl/key.pem
```

### 3. Nginx HTTPS 설정 활성화

```bash
# nginx/default.conf에서 HTTPS 블록 주석 해제
nano workout-frontend/nginx/default.conf

# 프론트엔드 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart frontend
```

---

## 모니터링

### 1. 로그 모니터링

```bash
# 실시간 로그 모니터링
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f backend | grep ERROR

# 로그 파일로 저장
docker-compose -f docker-compose.prod.yml logs > /home/ubuntu/workout-app/logs/app_$(date +%Y%m%d).log
```

### 2. 리소스 모니터링

```bash
# 컨테이너 리소스 사용량
docker stats --no-stream

# 디스크 사용량
df -h
docker system df
```

### 3. 헬스체크 스크립트

**파일: `scripts/healthcheck.sh`**

```bash
#!/bin/bash

# 헬스체크
curl -f http://localhost/health || echo "Frontend 응답 없음"
curl -f http://localhost/api/health || echo "Backend 응답 없음"

# 컨테이너 상태
docker-compose -f /home/ubuntu/workout-app/docker-compose.prod.yml ps
```

---

## 완료 체크리스트

- [ ] 기존 JAR, Nginx, MySQL 서비스 중단
- [ ] 기존 데이터베이스 백업 완료
- [ ] Docker 및 Docker Compose 설치
- [ ] 프로젝트 디렉토리 구조 생성
- [ ] 모든 설정 파일 생성 및 배치
- [ ] `.env` 파일 설정 및 권한 조정
- [ ] GitHub Secrets 추가
- [ ] 데이터베이스 복원
- [ ] Docker Compose로 컨테이너 시작
- [ ] 헬스체크 통과 확인
- [ ] 자동 백업 Cron 설정
- [ ] GitHub Actions 첫 배포 테스트
- [ ] 방화벽 설정 (선택사항)
- [ ] SSL 인증서 설정 (선택사항)

---

## 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Nginx 공식 문서](https://nginx.org/en/docs/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)

---

**축하합니다! 🎉**
이제 완전히 컨테이너화된 CI/CD 환경이 구축되었습니다.
코드를 푸시하면 자동으로 배포되며, 백업도 자동으로 수행됩니다!
