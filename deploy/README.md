# Workout & Diet Tracker - Docker 배포 가이드

## 사전 요구사항

- Docker 설치 (20.10 이상)
- Docker Compose 설치 (2.0 이상)
- 포트 80, 8080 사용 가능

## 빠른 시작 (Quick Start)

1. **모든 서비스 빌드 및 실행:**
   ```bash
   docker-compose up -d --build
    ```

2. **서비스 상태 확인:**

   ```bash
   docker-compose ps
   ```

3. **로그 확인:**

   ```bash
   docker-compose logs -f
   ```

## 애플리케이션 접속 정보

* **프론트엔드**: [http://localhost](http://localhost)
* **백엔드 API**: [http://localhost:8080](http://localhost:8080)
* **H2 데이터베이스 콘솔**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)

    * JDBC URL: `jdbc:h2:mem:workoutdb`
    * Username: `sa`
    * Password: (비어 있음)

## Docker 서비스 구성

### Backend (workout-backend)

* **포트**: 8080
* **기술 스택**: Spring Boot 3.4, Java 21
* **데이터베이스**: H2 인메모리
* **헬스 체크**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

### Frontend (workout-frontend)

* **포트**: 80
* **기술 스택**: React, Vite, Nginx
* **API 프록시**: `/api/*` 요청을 백엔드로 프록시 처리

## 주요 명령어

### 서비스 중지:

```bash
docker-compose down
```

### 서비스 중지 및 볼륨 제거 (모든 데이터 삭제):

```bash
docker-compose down -v
```

### 특정 서비스만 재빌드:

```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### 백엔드 로그 확인:

```bash
docker-compose logs -f backend
```

### 프론트엔드 로그 확인:

```bash
docker-compose logs -f frontend
```

### 백엔드 컨테이너에서 명령 실행:

```bash
docker-compose exec backend bash
```

### 프론트엔드 컨테이너에서 명령 실행:

```bash
docker-compose exec frontend sh
```

## 트러블슈팅

### 포트 충돌

포트 80 또는 8080이 이미 사용 중인 경우:

```bash
# 포트 사용 프로세스 확인
lsof -i :80
lsof -i :8080

# 프로세스 강제 종료
kill -9 <PID>
```

### 백엔드가 시작되지 않을 때

```bash
# 백엔드 로그 확인
docker-compose logs backend

# 완전 초기화 후 재빌드
docker-compose down -v
docker-compose up -d --build
```

### 프론트엔드에서 백엔드에 연결되지 않을 때

```bash
# 백엔드 헬스 체크 확인
curl http://localhost:8080/actuator/health

# 프론트엔드 재시작
docker-compose restart frontend
```

### 헬스 체크 실패

초기 기동 시 헬스 체크는 최대 40초까지 실패할 수 있습니다. 계속 실패할 경우:

```bash
# 애플리케이션 실행 여부 확인
curl http://localhost:8080/api/auth/login

# 상세 로그 확인
docker-compose logs backend
```

## 프로덕션 배포 시 고려사항

### Oracle Cloud 또는 기타 클라우드 환경의 경우:

1. **보안**: 보안 그룹 / 방화벽 규칙을 통해 포트 개방
2. **SSL/TLS**: SSL 인증서를 적용한 리버스 프록시(Nginx) 사용
3. **데이터베이스**: H2 대신 영속 DB(MySQL, PostgreSQL) 사용
4. **환경 변수**: 민감 정보는 `.env` 파일로 관리
5. **모니터링**: 로그 수집 시스템 추가 (ELK, Loki)
6. **백업**: 데이터베이스 백업 구성

### 영속 DB(MySQL) 사용 예시:

`docker-compose.yml`을 다음과 같이 수정:

```yaml
services:
  mysql:
    image: mysql:8
    container_name: workout-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: workoutdb
      MYSQL_USER: workout
      MYSQL_PASSWORD: password
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - workout-network

  backend:
    # ... 기존 설정
    depends_on:
      - mysql
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/workoutdb

volumes:
  mysql-data:
```

## 아키텍처

```
Internet
    |
    v
Nginx (Frontend) :80
    | (proxy /api/*)
    v
Spring Boot (Backend) :8080
    |
    v
H2 Database (in-memory)
```

## 지원 (Support)

문제가 발생할 경우:

1. 로그 확인: `docker-compose logs`
2. 포트 사용 여부 확인
3. Docker 리소스 할당 확인
4. 클라우드 환경의 방화벽 / 보안 그룹 설정 확인

```
```
