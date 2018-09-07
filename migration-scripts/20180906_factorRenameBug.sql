ALTER TABLE factor DROP CONSTRAINT IF EXISTS factor_new_ak_1;

ALTER TABLE factor ADD CONSTRAINT factor_new_ak_1 UNIQUE (experiment_id, name) DEFERRABLE;
