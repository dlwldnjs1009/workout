-- MySQL 8 production migration. Run this once with the backend stopped, right before deploying
-- the version that pins the JVM time zone to Asia/Seoul (WorkoutApplication.main).
--
-- 2026-01-12 Docker 배포부터 backend JVM은 UTC, JDBC 연결은 serverTimezone=Asia/Seoul이었다.
-- Connector/J가 그 차이만큼 workout_sessions.date를 +9시간 옮겨 저장했다. JVM을 Asia/Seoul로 맞춘
-- 버전은 저장값을 그대로 읽으므로, 그 전에 밀린 행을 되돌린다.
--
-- 대상: id 20 ~ 실행 시점의 MAX(id).
--   - id 16 이하는 Docker 이전 데이터다(2026-01-07~10). 밀리지 않았으므로 제외한다. id 17~19는 없다.
--   - id 20(2026-01-14 04:46)부터 Docker 배포 뒤에 저장됐다.
--   - 새 backend가 저장한 행은 밀리지 않는다. backend가 멈춘 상태에서 실행해야 MAX(id)가 경계가 된다.
-- users.created_at 등 LocalDateTime.now()로 저장한 컬럼은 UTC 시각 + 9시간 = 실제 KST로 저장돼 있어 대상이 아니다.
--
-- 두 번 실행하면 18시간이 밀리므로 data_migrations 표지로 두 번째 실행부터는 아무것도 바꾸지 않는다.

CREATE TABLE IF NOT EXISTS data_migrations (
    name       VARCHAR(100) NOT NULL PRIMARY KEY,
    applied_at DATETIME     NOT NULL
);

SET @from_id := 20;
SET @to_id := (SELECT MAX(id) FROM workout_sessions);

START TRANSACTION;

INSERT IGNORE INTO data_migrations (name, applied_at)
VALUES ('V20261002__shift_workout_session_dates_to_kst', NOW());
SET @first_run := ROW_COUNT();

UPDATE workout_sessions
   SET date = date - INTERVAL 9 HOUR
 WHERE @first_run = 1
   AND id BETWEEN @from_id AND @to_id;

SELECT @first_run AS first_run, @from_id AS from_id, @to_id AS to_id, ROW_COUNT() AS shifted_rows;

COMMIT;
