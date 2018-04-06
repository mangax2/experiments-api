INSERT INTO ref_data_source_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('QandA', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);

WITH question_type AS (
  SELECT id FROM ref_data_source_type
  WHERE type='QandA'
)
INSERT INTO ref_data_source (name, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
SELECT 'Question', qt.id, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP
FROM question_type qt;

ALTER TABLE public.factor_level DROP CONSTRAINT factor_level_new_ak_1;

ALTER TABLE public.factor_level
    ADD CONSTRAINT factor_level_new_ak_1 UNIQUE (factor_id, value)
    DEFERRABLE INITIALLY DEFERRED;