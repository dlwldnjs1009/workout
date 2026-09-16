-- MySQL 8 production migration for guest accounts (POST /api/auth/guest).
--
-- 이 스크립트는 몇 번 실행해도 안전하다. 배포가 GitHub Actions로 자동화돼 있어
-- ddl-auto=update가 컬럼을 먼저 만들어 둔 상태에서 실행될 수 있기 때문이다.
-- ddl-auto가 만들어 주지 않는(또는 만들었는지 확신할 수 없는) 인덱스를 확정하는 것이
-- 이 파일의 실제 목적이다.
--
-- MySQL 8은 ADD COLUMN / CREATE INDEX에 IF NOT EXISTS를 지원하지 않으므로
-- information_schema로 존재 여부를 확인한 뒤 동적 실행한다.

-- 1. users.is_guest
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_guest');
SET @sql := IF(@exists = 0,
               'ALTER TABLE users ADD COLUMN is_guest BIT(1) NOT NULL DEFAULT b''0''',
               'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. users.expires_at
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'expires_at');
SET @sql := IF(@exists = 0,
               'ALTER TABLE users ADD COLUMN expires_at DATETIME(6) NULL',
               'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. GuestCleanupService가 매시 실행하는 findTop200ByGuestTrueAndExpiresAtBefore 조회용 인덱스
SET @exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_guest_expires_at');
SET @sql := IF(@exists = 0,
               'CREATE INDEX idx_guest_expires_at ON users (is_guest, expires_at)',
               'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
