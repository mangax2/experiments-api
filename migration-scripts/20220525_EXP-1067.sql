ALTER TABLE factor_properties_for_level 
	RENAME COLUMN catalog_type TO material_type;

ALTER TABLE factor_level_details
	ADD COLUMN material_category VARCHAR;

UPDATE
	factor_level_details
SET
	material_category = 'Catalog'
WHERE
	id IN (
		SELECT
			factor_level_details.id FROM factor_level_details
			INNER JOIN factor_properties_for_level ON factor_level_details.factor_properties_for_level_id = factor_properties_for_level.id
		WHERE
			factor_properties_for_level.material_type IS NOT NULL
    );