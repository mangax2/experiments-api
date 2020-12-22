-- The following line turns triggers off for this transaction. This is done
-- to greatly improve the speed of this query (from ~130s to 7s in Dev)
SET session_replication_role = replica;

UPDATE factor_level
SET value = REGEXP_REPLACE(
		REGEXP_REPLACE(value::text,
			'"isPlaceholder": true',
			'"isPlaceholder": true, "valueType": "placeholder"',
			'g'
		),
		'"isPlaceholder": false',
		'"isPlaceholder": false, "valueType": "exact"',
		'g'
	)::jsonb;

SET session_replication_role = DEFAULT;
