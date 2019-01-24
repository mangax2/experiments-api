ALTER TABLE unit_spec_detail ALTER COLUMN uom_id TYPE varchar(50) USING (uom_id::varchar);

UPDATE unit_spec_detail
SET uom_id = 'ft'
WHERE uom_id = '1';

UPDATE unit_spec_detail
SET uom_id = 'in'
WHERE uom_id = '2';

UPDATE unit_spec_detail
SET uom_id = 'm'
WHERE uom_id = '3';

UPDATE unit_spec_detail
SET uom_id = 'cm'
WHERE uom_id = '4';