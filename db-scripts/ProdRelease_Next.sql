BEGIN TRANSACTION;

ALTER TABLE unit
	ADD COLUMN location INT;

WITH RECURSIVE groups_with_parents AS (
	SELECT id, parent_id, id AS loc_id 
	FROM public.group
	
	UNION ALL
	
	SELECT gwp.id, g.parent_id, g.id AS loc_id 
	FROM groups_with_parents gwp 
		INNER JOIN public.group g 
			ON gwp.parent_id = g.id
), unit_location_map AS (
	SELECT u.id, gv.value AS loc_number 
	FROM unit u 
		INNER JOIN groups_with_parents gwp 
			ON u.group_id = gwp.id 
		INNER JOIN group_value gv 
			ON gwp.loc_id = gv.group_id 
	WHERE gwp.parent_id IS NULL 
		AND gv.name = 'locationNumber'
)
UPDATE unit
SET location = ulm.loc_number::INT
FROM unit_location_map ulm
WHERE unit.id = ulm.id;

ALTER TABLE unit
	ALTER COLUMN location SET NOT NULL;
	
ROLLBACK;
