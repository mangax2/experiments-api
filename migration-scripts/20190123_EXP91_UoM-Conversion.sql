ALTER TABLE unit_spec_detail ADD COLUMN uom_code varchar(50);

UPDATE unit_spec_detail
SET uom_code = 'ft'
WHERE uom_id = '1';

UPDATE unit_spec_detail
SET uom_code = 'in'
WHERE uom_id = '2';

UPDATE unit_spec_detail
SET uom_code = 'm'
WHERE uom_id = '3';

UPDATE unit_spec_detail
SET uom_code = 'cm'
WHERE uom_id = '4';
