# syntax=docker/dockerfile:1

# Stage 1: 빌드
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Sentry 인증 토큰 (소스 컨텍스트 업로드용)
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

# Gradle 캐시 디렉토리 설정
ENV GRADLE_USER_HOME=/cache/.gradle

# Gradle 파일만 먼저 복사 (의존성 레이어 분리)
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# 의존성만 먼저 다운로드 (캐시 마운트 사용)
RUN --mount=type=cache,target=/cache/.gradle \
    gradle dependencies --no-daemon

# 소스 코드 복사
COPY src ./src

# 애플리케이션 빌드 (캐시 마운트 사용)
RUN --mount=type=cache,target=/cache/.gradle \
    gradle build -x test --no-daemon

# Stage 2: JAR 레이어 추출 (layertools는 JDK 권장)
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
# Spring Boot Layertools를 사용하여 JAR 레이어 추출 (클래스 로딩 경합 해결)
RUN java -Djarmode=layertools -jar app.jar extract

# Stage 3: Datadog Agent 다운로드 (별도 레이어로 분리하여 캐싱 최적화)
FROM eclipse-temurin:21-jdk-alpine AS agent
RUN apk add --no-cache wget && \
    wget -O /dd-java-agent.jar https://dtdg.co/latest-java-tracer

# Stage 4: 실행 환경 (JDK - JFR/jcmd 프로파일링 도구 포함)
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# tini 설치 (PID 1 문제 해결 + healthcheck용 wget)
RUN apk add --no-cache tini wget

# 보안을 위한 non-root 사용자 생성
RUN addgroup -S spring && adduser -S spring -G spring

# Datadog Agent 복사 (캐시된 레이어에서)
COPY --from=agent /dd-java-agent.jar /app/dd-java-agent.jar

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
CMD ["java", "-javaagent:/app/dd-java-agent.jar", "org.springframework.boot.loader.launch.JarLauncher"]
