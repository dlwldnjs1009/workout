# 🚀 OCI LB + Nginx + Monitoring 통합 배포 계획서 (Final)

## 1. 아키텍처 및 트래픽 흐름

*   **Public (User)**: `https://todayfit.site` (OCI Load Balancer에서 SSL 종료)
*   **Internal (Gateway)**: `http://localhost:80` (Frontend 컨테이너 내 Nginx가 HTTP 수신)
*   **Protected Zone**: 모니터링 도구(Grafana, Prometheus 등)는 Nginx Basic Auth로 보호됨.

**트래픽 흐름:**
> User (HTTPS) → OCI LB (Decryption) → (HTTP) → Nginx (80) → [Backend / React / Grafana ...]

---

## 2. 사전 준비 (Prerequisites)

서버에서 **보안 인증 파일**과 **디렉토리**를 먼저 생성해야 컨테이너가 정상적으로 실행됩니다.

```bash
# 1. 프로젝트 루트로 이동
cd /home/ubuntu/workout-app

# 2. 디렉토리 구조 생성
mkdir -p nginx/secrets nginx/conf.d
mkdir -p monitoring/prometheus monitoring/loki monitoring/alloy

# 3. 인증 파일 생성 (htpasswd 유틸리티 필요: sudo apt install apache2-utils)
# Grafana용 (admin)
htpasswd -c nginx/secrets/.grafana_htpasswd admin

# 모니터링 도구 공용 (monitor)
htpasswd -c nginx/secrets/.monitor_htpasswd monitor
```

---

## 3. 설정 파일 작성 (Copy & Paste)

### 3-1. Nginx 설정 (`nginx/conf.d/default.conf`)
**핵심 수정사항**: SSL 제거, Upstream 이름 통일, 서브패스 Rewrite 완벽 적용.

```nginx
# =========================
# GZIP Settings
# =========================
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
gzip_disable "msie6";

# =========================
# Upstream Definitions
# (Docker Compose Service Name과 100% 일치해야 함)
# =========================
upstream backend     { server workout-backend:8080; }
upstream grafana     { server workout-grafana:3000; }
upstream prometheus  { server workout-prometheus:9090; }
upstream loki        { server workout-loki:3100; }
upstream alloy       { server workout-alloy:12345; }

# =====================================================
# Main Server (Listen 80 ONLY)
# SSL은 OCI Load Balancer가 처리하므로 여기선 HTTP만 받음
# =====================================================
server {
    listen 80;
    listen [::]:80;
    server_name todayfit.site www.todayfit.site;

    # OCI LB Real IP Trust (전체 대역 허용)
    set_real_ip_from 0.0.0.0/0;
    real_ip_header X-Forwarded-For;

    # -------------------------
    # Health Check (OCI LB용)
    # -------------------------
    location = /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "OK\n";
    }

    # -------------------------
    # Backend API & Health
    # -------------------------
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;

        # Websocket & Header Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https; # LB가 SSL 처리했음을 알림

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }

    # -------------------------
    # Frontend Static / React SPA
    # -------------------------
    root /usr/share/nginx/html;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # =========================
    # Monitoring Protected UI
    # (Basic Auth + Subpath Rewrite)
    # =========================

    # Grafana
    location /grafana/ {
        auth_basic "Monitoring Secure";
        auth_basic_user_file /etc/nginx/secrets/.grafana_htpasswd;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # [Critical] Trailing Slash 필수
        rewrite ^/grafana(/.*)$ $1 break;
        proxy_pass http://grafana/; 

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # Prometheus
    location /prometheus/ {
        auth_basic "Monitoring Secure";
        auth_basic_user_file /etc/nginx/secrets/.monitor_htpasswd;

        rewrite ^/prometheus(/.*)$ $1 break;
        proxy_pass http://prometheus/;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Loki
    location /loki/ {
        auth_basic "Monitoring Secure";
        auth_basic_user_file /etc/nginx/secrets/.monitor_htpasswd;

        rewrite ^/loki(/.*)$ $1 break;
        proxy_pass http://loki/;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Alloy
    location /alloy/ {
        auth_basic "Monitoring Secure";
        auth_basic_user_file /etc/nginx/secrets/.monitor_htpasswd;

        rewrite ^/alloy(/.*)$ $1 break;
        proxy_pass http://alloy/;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html { root /usr/share/nginx/html; }
}
```

### 3-2. Docker Compose (`docker-compose.prod.yml`)
**핵심 수정사항**: `frontend`에 Nginx 설정 및 Secrets 마운트, Monitoring 서비스 이름 통일.

```yaml
version: "3.8"

services:
  # ==============================
  # 1. Database
  # ==============================
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
    ports:
      - "127.0.0.1:3306:3306" # Local binding only
    networks:
      - workout-network
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u${MYSQL_USER} -p${MYSQL_PASSWORD} || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10

  # ==============================
  # 2. Application
  # ==============================
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
      SPRING_PROFILES_ACTIVE: prod
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "127.0.0.1:8080:8080" # Local binding only
    networks:
      - workout-network

  frontend:
    image: ghcr.io/${GITHUB_USERNAME}/workout-frontend:latest
    container_name: workout-frontend
    restart: always
    ports:
      - "80:80" # HTTP 80 Exposed for OCI LB
    volumes:
      # [Core] Nginx Config Injection
      - ./nginx/conf.d/default.conf:/etc/nginx/conf.d/default.conf
      # [Core] Auth Secrets Injection
      - ./nginx/secrets:/etc/nginx/secrets
    depends_on:
      - backend
      - workout-grafana
    networks:
      - workout-network

  # ==============================
  # 3. Monitoring Stack
  # ==============================
  workout-grafana:
    image: grafana/grafana:latest
    container_name: workout-grafana
    restart: always
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      # [Critical] Subpath Configuration
      - GF_SERVER_ROOT_URL=https://todayfit.site/grafana/
      - GF_SERVER_SERVE_FROM_SUB_PATH=true
      - GF_SERVER_DOMAIN=todayfit.site
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    networks:
      - workout-network

  workout-prometheus:
    image: prom/prometheus:latest
    container_name: workout-prometheus
    restart: always
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--web.external-url=/prometheus/' # UI Link Fix
      - '--web.route-prefix=/' # Proxy handles the stripping
    networks:
      - workout-network

  workout-loki:
    image: grafana/loki:latest
    container_name: workout-loki
    restart: always
    volumes:
      - ./monitoring/loki/local-config.yaml:/etc/loki/local-config.yaml
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - workout-network

  workout-alloy:
    image: grafana/alloy:latest
    container_name: workout-alloy
    restart: always
    volumes:
      - ./monitoring/alloy/config.alloy:/etc/alloy/config.alloy
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: run --server.http.listen-addr=0.0.0.0:12345 --storage.path=/var/lib/alloy/data /etc/alloy/config.alloy
    networks:
      - workout-network

networks:
  workout-network:
    driver: bridge

volumes:
  mysql_data:
  grafana_data:
  prometheus_data:
  loki_data:
```

---

## 4. 실행 및 검증 절차

### Step 1. 배포
```bash
# 1. 설정 파일 확인
ls -l nginx/conf.d/default.conf
ls -l nginx/secrets/

# 2. 컨테이너 재기동
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Step 2. OCI Load Balancer 설정 확인
*   **Backend Set Health Check**:
    *   Protocol: `HTTP`
    *   Port: `80`
    *   URL: `/health`
    *   Status: `200`

### Step 3. 최종 접속 테스트
1.  **메인 서비스**: `https://todayfit.site` (정상 접속 확인)
2.  **API Health**: `https://todayfit.site/api/health` (backend 헬스 체크)
3.  **Grafana**: `https://todayfit.site/grafana/`
    *   1차: Nginx Basic Auth (`admin` / `htpasswd`)
    *   2차: Grafana Login (`admin` / `GF_SECURITY_ADMIN_PASSWORD`)
4.  **Prometheus**: `https://todayfit.site/prometheus/` (UI 깨짐 없이 로드 확인)

이 계획서대로 진행하시면, 꼬임 없이 한 번에 운영 환경 구축이 완료됩니다.
