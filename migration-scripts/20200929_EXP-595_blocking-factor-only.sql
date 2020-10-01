ALTER TABLE factor
ADD COLUMN is_blocking_factor_only BOOLEAN;

UPDATE factor
SET is_blocking_factor_only = false;

ALTER TABLE factor
ALTER COLUMN is_blocking_factor_only SET NOT NULL;
