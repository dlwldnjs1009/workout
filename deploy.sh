#!/bin/bash
# deploy.sh

KEY_FILE="/Users/jiwon/Documents/oracleKey/ssh-key-2025-11-06.key"
SERVER_IP="168.138.191.40"

echo "🛑 기존 프로세스 종료..."
ssh -i $KEY_FILE ubuntu@$SERVER_IP "pkill -f 'java -jar app.jar'"

echo "🔨 프로젝트 빌드..."
./gradlew clean build -x test
cd workout-frontend && npm run build && cd ..

echo "📤 파일 전송..."
scp -i $KEY_FILE build/libs/workout-0.0.1-SNAPSHOT.jar ubuntu@$SERVER_IP:/home/ubuntu/app.jar
scp -i $KEY_FILE -r workout-frontend/dist ubuntu@$SERVER_IP:/home/ubuntu/

echo "🚀 서비스 재시작..."
ssh -i $KEY_FILE ubuntu@$SERVER_IP "nohup java -jar app.jar > app.log 2>&1 &"

echo "✅ 배포 완료!"
