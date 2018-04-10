INSERT INTO ref_data_source_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('QandA', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);

WITH question_type AS (
  SELECT id FROM ref_data_source_type
  WHERE type='QandA'
)
INSERT INTO ref_data_source (name, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
SELECT 'Question', qt.id, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP
FROM question_type qt;


--update factor level items with 'isPlaceholder = true' where isPlaceholder is not set
with recursive
    itemsArray as (
      select id as fl_id,
             case
             when json_typeof(to_json(value #>'{items}')) = 'array' and (value #>'{items, 0}')::jsonb ? 'items'
               then jsonb_array_elements(to_jsonb(value #>'{items}'))

             when json_typeof(to_json(value #>'{items}')) = 'array'
               then value
             end as value
      from factor_level
  ),
    itemsArrayWithPHAdded AS (
    select fl_id, 0 as nr,
                  case
                  when (ia.value #>'{items, 0}')::jsonb ? 'isPlaceholder' = false
                    then jsonb_set(ia.value::jsonb, '{items, 0}', (ia.value #>'{items, 0}')::jsonb || '{"isPlaceholder": true}'::jsonb, true)
                  else
                    ia.value
                  end as value
    from itemsArray ia
    where (ia.value)::jsonb ? 'items'

    UNION ALL

    select fl_id, nr + 1,
      case
      when (jsonb_extract_path(value, 'items')->>(nr+1))::jsonb ? 'isPlaceholder' = false
        then jsonb_set(value::jsonb, ('{items,' || nr+1 || '}')::text[], (jsonb_extract_path(value, 'items')->>(nr +1))::jsonb || '{"isPlaceholder": true}'::jsonb, true)
      else
        value
      end as value
    from itemsArrayWithPHAdded
    where jsonb_array_length((value #>'{items}')::jsonb) > (nr+1)
  ),
    uniqueFLitemsWithPHArray as (
      select fl_id, nr, jsonb_agg(to_json(value)) as value
      from itemsArrayWithPHAdded as tab
      where jsonb_array_length((value #>'{items}')::jsonb) = (nr+1)
      group by fl_id, nr
  )
update factor_level as fl
set value = jsonb_set(fl.value, '{items}', ua.value)
from uniqueFLitemsWithPHArray ua
where ua.fl_id = fl.id;