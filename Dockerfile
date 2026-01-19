# Stage 1: 빌드
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Gradle 파일 복사
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# 소스 코드 복사
COPY src ./src

# 애플리케이션 빌드
RUN gradle build -x test --no-daemon

# Stage 2: JAR 레이어 추출 (layertools는 JDK 권장)
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
# Spring Boot Layertools를 사용하여 JAR 레이어 추출 (클래스 로딩 경합 해결)
RUN java -Djarmode=layertools -jar app.jar extract

# Stage 3: 실행 환경
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# tini + wget 설치 (PID 1 문제 해결 + healthcheck 지원)
RUN apk add --no-cache tini wget

# 보안을 위한 non-root 사용자 생성
RUN addgroup -S spring && adduser -S spring -G spring

# 추출된 레이어를 순서대로 복사 (Docker 캐싱 최적화)
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# 소유권 변경
RUN chown -R spring:spring /app
USER spring:spring

# 포트 노출
EXPOSE 8080

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# tini를 PID 1로 실행, JAVA_TOOL_OPTIONS 환경변수로 JVM 설정 주입
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["java", "org.springframework.boot.loader.launch.JarLauncher"]
