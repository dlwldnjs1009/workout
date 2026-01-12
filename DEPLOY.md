# 🚀 Oracle Cloud Infrastructure (OCI) 배포 가이드

이 문서는 Spring Boot + MySQL + React 프로젝트를 OCI의 Ubuntu 인스턴스에 배포하는 전체 과정을 설명합니다.

## 1. 인프라 준비 (OCI 콘솔)

### 1.1 인스턴스 생성
- **이미지**: `Ubuntu 22.04 LTS` (추천)
- **도구**: `SSH 키 쌍(.key)`을 생성하고 로컬 PC에 안전하게 저장합니다.

### 1.2 네트워크 설정 (VCN 보안 리스트)
인스턴스의 **Security List**에서 다음 **Ingress Rules**를 추가합니다.
- **HTTP**: 포트 `80`, Source `0.0.0.0/0`
- **HTTPS**: 포트 `443`, Source `0.0.0.0/0`
- **SSH**: 포트 `22`, Source `0.0.0.0/0` (기본값)

---

## 2. 서버 환경 구축 (SSH 접속)

로컬 터미널에서 서버에 접속합니다:
```bash
ssh -i <your-key-file>.key ubuntu@<인스턴스_공인_IP>
```

### 2.1 필수 소프트웨어 설치
```bash
sudo apt update
# 1. Java 21 설치
sudo apt install openjdk-21-jdk -y
# 2. MySQL Server 설치
sudo apt install mysql-server -y
# 3. Nginx 설치
sudo apt install nginx -y
```

### 2.2 MySQL 데이터베이스 설정
```bash
sudo mysql -u root
```
MySQL 접속 후 다음 명령어를 실행합니다:
```sql
-- 데이터베이스 생성
CREATE DATABASE workout;

-- 사용자 생성 및 권한 부여 (비밀번호: 3690 예시)
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '3690';
FLUSH PRIVILEGES;
EXIT;
```

### 2.3 환경 변수 설정 (JWT Secret)
Spring Boot 애플리케이션 실행에 필요한 환경 변수를 설정합니다.

**중요**: JWT_SECRET은 최소 32자 이상의 영문+숫자 조합을 사용해야 합니다.

```bash
# 환경 변수 생성 (예시 - 실제 프로덕션에서는 안전한 키 사용)
export JWT_SECRET="workout-production-jwt-secret-key-2024-secure-minimum-32chars"

# 영구 저장 (서버 재시작 시에도 유지)
echo 'export JWT_SECRET="workout-production-jwt-secret-key-2024-secure-minimum-32chars"' >> ~/.bashrc
source ~/.bashrc

# 환경 변수 확인
echo $JWT_SECRET
```

**보안 권장사항**:
- 프로덕션 환경에서는 무작위 문자열 생성기를 사용하세요
- 절대 Git에 커밋하지 마세요
- 최소 32자 이상, 영문 대소문자 + 숫자 + 특수문자 조합 권장

---

## 3. 로컬 개발 환경 설정 (선택사항)

로컬에서 애플리케이션을 실행하려면 JWT_SECRET 환경 변수가 필요합니다.

### 방법 1: 환경 변수로 실행
```bash
# Mac/Linux
export JWT_SECRET="local-dev-jwt-secret-minimum-32-characters"
./gradlew bootRun

# Windows (CMD)
set JWT_SECRET=local-dev-jwt-secret-minimum-32-characters
gradlew bootRun

# Windows (PowerShell)
$env:JWT_SECRET="local-dev-jwt-secret-minimum-32-characters"
./gradlew bootRun
```

### 방법 2: IDE 설정
**IntelliJ IDEA**:
1. Run > Edit Configurations
2. Environment variables에 `JWT_SECRET=local-dev-jwt-secret-minimum-32-characters` 추가

**VS Code**:
1. `.vscode/launch.json` 생성
2. 다음 내용 추가:
```json
{
  "configurations": [
    {
      "type": "java",
      "name": "Spring Boot",
      "request": "launch",
      "mainClass": "com.example.workout.WorkoutApplication",
      "env": {
        "JWT_SECRET": "local-dev-jwt-secret-minimum-32-characters"
      }
    }
  ]
}
```

---

## 4. 로컬 프로젝트 빌드 및 파일 전송

### 4.1 백엔드 빌드 (로컬 PC)
```bash
./gradlew clean build -x test
```
- 결과물: `build/libs/workout-0.0.1-SNAPSHOT.jar`

### 4.2 프론트엔드 빌드 (로컬 PC)
```bash
cd workout-frontend
npm install
npm run build
```
- 결과물: `dist/` 폴더

### 4.3 서버로 파일 전송 (로컬 PC)
```bash
# JAR 파일 전송
scp -i <key> build/libs/*.jar ubuntu@<IP>:/home/ubuntu/app.jar
# 프론트 빌드 폴더 전송
scp -i <key> -r workout-frontend/dist ubuntu@<IP>:/home/ubuntu/
```

---

## 5. 서버 실행 및 Nginx 설정

### 5.1 백엔드 실행 (서버)
```bash
# 환경 변수가 ~/.bashrc에 설정되어 있다면
nohup java -jar app.jar > app.log 2>&1 &

# 또는 환경 변수를 직접 지정해서 실행
nohup env JWT_SECRET="workout-production-jwt-secret-key-2024-secure-minimum-32chars" java -jar app.jar > app.log 2>&1 &

# 프로세스 확인
ps aux | grep app.jar

# 로그 확인
tail -f app.log
```

### 5.2 Nginx 설정 (Reverse Proxy)
```bash
sudo nano /etc/nginx/sites-available/default
```
파일 내용을 아래와 같이 수정합니다:
```nginx
server {
    listen 80;
    server_name _;

    # 프론트엔드 서빙
    location / {
        root /home/ubuntu/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API 프록시
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
설정 저장 후 Nginx 재시작:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. 최종 확인
브라우저에서 `http://<인스턴스_공인_IP>`에 접속하여 서비스가 정상 작동하는지 확인합니다.

**확인 사항**:
- 로그인/회원가입 작동 확인
- JWT 토큰 정상 발급 확인
- API 요청 정상 응답 확인

로그에서 오류 확인:
```bash
tail -100 app.log
```

## 7. 재배포

### 전체 재배포 순서

```bash
# 1. 서버 접속 후 기존 프로세스 종료
ssh -i <your-key-file>.key ubuntu@<인스턴스_IP>
pkill -f 'java -jar app.jar'
exit

# 2. 로컬에서 빌드
./gradlew clean build -x test
cd workout-frontend && npm run build && cd ..

# 3. 파일 전송 (덮어쓰기)
# 백엔드 JAR
scp -i <your-key-file>.key build/libs/*.jar ubuntu@<인스턴스_IP>:/home/ubuntu/app.jar
# 프론트엔드 dist 폴더
scp -i <your-key-file>.key -r workout-frontend/dist ubuntu@<인스턴스_IP>:/home/ubuntu/

# 4. 서비스 재시작
ssh -i <your-key-file>.key ubuntu@<인스턴스_IP>
# 백엔드 실행 (환경 변수는 ~/.bashrc에 이미 설정되어 있음)
nohup java -jar app.jar > app.log 2>&1 &
# Nginx 재시작 (프론트엔드 수정 시만)
sudo systemctl restart nginx
```

### 빠른 재배포 스크립트 (선택사항)

로컬 PC에서 재배포를 자동화할 수 있습니다:

```bash
#!/bin/bash
# deploy.sh

KEY_FILE="<your-key-file>.key"
SERVER_IP="<인스턴스_IP>"

echo "🛑 기존 프로세스 종료..."
ssh -i $KEY_FILE ubuntu@$SERVER_IP "pkill -f 'java -jar app.jar'"

echo "🔨 프로젝트 빌드..."
./gradlew clean build -x test
cd workout-frontend && npm run build && cd ..

echo "📤 파일 전송..."
scp -i $KEY_FILE build/libs/*.jar ubuntu@$SERVER_IP:/home/ubuntu/app.jar
scp -i $KEY_FILE -r workout-frontend/dist ubuntu@$SERVER_IP:/home/ubuntu/

echo "🚀 서비스 재시작..."
ssh -i $KEY_FILE ubuntu@$SERVER_IP "nohup java -jar app.jar > app.log 2>&1 &"

echo "✅ 배포 완료!"
```

실행 방법:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 요약
- 환경 변수는 서버 최초 설정 시 한 번만 설정 (재배포마다 설정할 필요 없음)
- rm 명령어 전부 제거 (덮어쓰기로 해결)
- scp 업로드 전에만 pkill로 프로세스 종료
