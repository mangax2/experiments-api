ALTER TABLE treatment ADD COLUMN control_types text[];

UPDATE treatment
SET control_types = CASE WHEN current_database() = 'experiments_prod' THEN '{"af6d651d-01c0-4083-8dca-ffed57fb0bcc"}' ELSE '{"340ec050-9827-48f2-8c43-8e73913cb286"}' END
WHERE is_control = TRUE;

ALTER TABLE treatment DROP COLUMN is_control;
