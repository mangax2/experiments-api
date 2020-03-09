INSERT INTO
	analysis_model (
		experiment_id,
		analysis_model_type,
		created_user_id,
		created_date,
		modified_user_id,
		modified_date
	)
SELECT
	e.id,
	'External',
	'ELLZR',
	CURRENT_TIMESTAMP,
	'ELLZR',
	CURRENT_TIMESTAMP
FROM
	experiment e
		LEFT JOIN analysis_model am
			ON e.id = am.experiment_id
WHERE
	am.experiment_id IS NULL;