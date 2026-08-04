-- MySQL 8 production migration. Run this once before deploying the version
-- that maps routine_exercises as the RoutineExercise entity.
--
-- Existing rows retain their routine/exercise pairing. As the old many-to-many
-- table did not persist an order or prescription, it receives the safe default
-- of 3 sets x 10 reps with 90 seconds rest.
--
-- The old @ManyToMany join table was generated as
--   PRIMARY KEY (exercise_id, routine_id)
-- so that key must be dropped in the same statement that introduces the
-- surrogate id, otherwise MySQL rejects it with ERROR 1068. The pairing stays
-- unique through the uk_routine_exercise constraint added below.

ALTER TABLE routine_exercises
    DROP PRIMARY KEY,
    ADD COLUMN id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0,
    ADD COLUMN target_sets INT NOT NULL DEFAULT 3,
    ADD COLUMN target_reps INT NOT NULL DEFAULT 10,
    ADD COLUMN rest_seconds INT NOT NULL DEFAULT 90;

UPDATE routine_exercises AS target
JOIN (
    SELECT routine_id, exercise_id,
           ROW_NUMBER() OVER (PARTITION BY routine_id ORDER BY exercise_id) AS sort_order
    FROM routine_exercises
) AS ordered
  ON target.routine_id = ordered.routine_id
 AND target.exercise_id = ordered.exercise_id
SET target.sort_order = ordered.sort_order;

ALTER TABLE routine_exercises
    ADD CONSTRAINT uk_routine_exercise UNIQUE (routine_id, exercise_id),
    ADD INDEX idx_routine_exercise_order (routine_id, sort_order);
