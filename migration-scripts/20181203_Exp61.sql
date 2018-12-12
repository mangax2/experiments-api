ALTER TABLE location_association ADD COLUMN block INTEGER;

ALTER TABLE location_association DROP CONSTRAINT location_association_experiment_id_location_key;

ALTER TABLE location_association ADD CONSTRAINT location_association_experiment_id_location_number_block_key UNIQUE (experiment_id, location, block);
