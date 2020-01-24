ALTER TABLE treatment_block
ADD COLUMN num_per_rep INT;
UPDATE treatment_block SET num_per_rep = 1;
ALTER TABLE treatment_block
ALTER COLUMN num_per_rep SET NOT NULL;