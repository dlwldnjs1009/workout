# 루틴 처방 데이터 마이그레이션

`routine_exercises`는 기존에 운동 ID만 보관하던 조인 테이블이었다. 이제는 각 운동의 순서, 목표 세트·횟수, 휴식 시간을 보관하는 `RoutineExercise` 엔티티다.

운영 MySQL 8 DB에는 애플리케이션 배포 전에 다음 SQL을 한 번 실행한다.

```bash
mysql -u <user> -p workout < src/main/resources/db/migration/V20260804__upgrade_routine_exercises.sql
```

기존 행은 손실하지 않는다. 이전 모델에 처방 데이터가 없었으므로 모든 기존 운동에 `3세트 × 10회`, 휴식 `90초`를 기본값으로 적용하며, 종목 순서는 운동 ID 기준으로 결정된다.

새 개발 DB는 Hibernate가 새 테이블 구조를 생성한다. 이 SQL은 기존 `routine_exercises` 테이블을 가진 운영 DB를 위한 일회성 마이그레이션이므로, 이미 실행한 DB에는 다시 적용하지 않는다.
