INSERT INTO ref_design_spec(name, created_user_id, created_date, modified_user_id, modified_date)
VALUES('Are All Blocks At All Locations', 'migration', current_timestamp, 'migration', current_timestamp);

INSERT INTO design_spec_detail(experiment_id, value, ref_design_spec_id, created_user_id, created_date, modified_user_id, modified_date)
SELECT experiment_id, true, (SELECT id FROM ref_design_spec WHERE name = 'Are All Blocks At All Locations'), 'migration', current_timestamp, 'migration', current_timestamp
FROM block
GROUP BY experiment_id
HAVING count(experiment_id) > 1;