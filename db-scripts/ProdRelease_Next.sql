INSERT INTO ref_data_source_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('QandA', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);

WITH question_type AS (
  SELECT id FROM ref_data_source_type
  WHERE type='QandA'
)
INSERT INTO ref_data_source (name, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
SELECT 'Question', qt.id, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP
FROM question_type qt;


--update factor level value column for multiline items
with itemsArray as (
select fl.id as fl_id, json_array_elements(to_json(fl.value #>'{items}')) as value from factor_level fl
where json_typeof(to_json(fl.value #>'{items}')) = 'array'
),
multilineitemsArrayWithPHAdded as (
select ia.fl_id,
jsonb_set(ia.value::jsonb, '{items, 0}', (ia.value #>'{items, 0}')::jsonb || '{"isPlaceholder": true}'::jsonb, true)  as value
from itemsArray ia
where (ia.value #>'{items, 0}')::jsonb ? 'isPlaceholder' = false
and (ia.value)::jsonb ? 'items'
),
uniqueFLitemsWithPHArray as (
select fl_id, jsonb_agg(to_json(value)) as value
from multilineitemsArrayWithPHAdded as tab
group by fl_id
)
update factor_level as fl
set value = jsonb_set(fl.value, '{items}', ua.value)
from uniqueFLitemsWithPHArray ua
where ua.fl_id = fl.id;

--update factor level value column for single line items
with itemsArray as (
select fl.id as fl_id, fl.value from factor_level fl
where (fl.value #>'{items, 0}')::jsonb ? 'items' = false
),
itemsArrayWithPHAdded as (
select ia.fl_id,
jsonb_set(ia.value::jsonb, '{items, 0}', (ia.value #>'{items, 0}')::jsonb || '{"isPlaceholder": true}'::jsonb, true)  as value
from itemsArray ia
where (ia.value #>'{items, 0}')::jsonb ? 'isPlaceholder' = false
)
update factor_level as fl
set value = ua.value
from itemsArrayWithPHAdded ua
where ua.fl_id = fl.id;