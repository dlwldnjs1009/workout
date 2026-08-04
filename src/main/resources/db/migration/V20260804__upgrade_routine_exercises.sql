-- MySQL 8 production migration. Run this once before deploying the version
-- that maps routine_exercises as the RoutineExercise entity.
--
-- Existing rows retain their routine/exercise pairing. As the old many-to-many
-- table did not persist an order or prescription, it receives the safe default
-- of 3 sets x 10 reps with 90 seconds rest.
--
-- The old @ManyToMany join table has a composite primary key referenced by
-- two foreign keys. MySQL requires those foreign keys to be temporarily
-- dropped before replacing that key with the surrogate id; they are recreated
-- in this same atomic ALTER TABLE statement.

ALTER TABLE routine_exercises
    DROP FOREIGN KEY FKjpu4f97xq7ll0tchsmrusqpqk,
    DROP FOREIGN KEY FKtdvobbrx8ftupxhmdxjjlp5of,
    DROP PRIMARY KEY,
    ADD COLUMN id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0,
    ADD COLUMN target_sets INT NOT NULL DEFAULT 3,
    ADD COLUMN target_reps INT NOT NULL DEFAULT 10,
    ADD COLUMN rest_seconds INT NOT NULL DEFAULT 90,
    ADD CONSTRAINT fk_routine_exercises_exercise FOREIGN KEY (exercise_id) REFERENCES exercise_types (id),
    ADD CONSTRAINT fk_routine_exercises_routine FOREIGN KEY (routine_id) REFERENCES workout_routines (id);

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
