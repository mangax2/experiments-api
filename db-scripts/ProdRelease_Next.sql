INSERT INTO ref_data_source_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('QandA', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);

WITH question_type AS (
  SELECT id FROM ref_data_source_type
  WHERE type='QandA'
)
INSERT INTO ref_data_source (name, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
SELECT 'Question', qt.id, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP
FROM question_type qt;

ALTER TABLE public.factor_level DROP CONSTRAINT factor_level_new_ak_1;

ALTER TABLE public.factor_level
    ADD CONSTRAINT factor_level_new_ak_1 UNIQUE (factor_id, value)
    DEFERRABLE INITIALLY DEFERRED;
    
--update factor level items with 'isPlaceholder = true' where isPlaceholder is not set
drop table if exists itemsArrayWithPHAddedTable;
drop table if exists uniqueFLitemsWithPHArray;
drop table if exists uniqueFLmultiitemsWithPHArray;
with recursive
    itemsArraywithoutNested as (
      select fl.id as fl_id,
             case
             when json_typeof(to_json(fl.value #>'{items}')) = 'array' and (fl.value #>'{items, 0}')::jsonb ? 'items'
               then jsonb_array_elements(to_jsonb(fl.value #>'{items}'))

             when json_typeof(to_json(fl.value #>'{items}')) = 'array'
               then fl.value
             end as value

      from factor_level fl
  ),
    itemsArray as (
      select fl_id, ian.value,
        case
        when json_typeof(to_json(fl.value #>'{items}')) = 'array' and (fl.value #>'{items, 0}')::jsonb ? 'items'
          then 'yes'
        else 'no'
        end as nested

      from factor_level fl, itemsArraywithoutNested ian
      where fl.id = ian.fl_id
  ),
    itemsArrayWithPHAdded AS (
    select nested, fl_id, 0 as nr,
                          case
                          when (ia.value #>'{items, 0}')::jsonb ? 'isPlaceholder' = false
                            then jsonb_set(ia.value::jsonb, '{items, 0}', (ia.value #>'{items, 0}')::jsonb || '{"isPlaceholder": true}'::jsonb, true)
                          else
                            ia.value
                          end as value
    from itemsArray ia
    where (ia.value)::jsonb ? 'items'

    UNION ALL

    select nested, fl_id, nr + 1,
      case
      when (jsonb_extract_path(value, 'items')->>(nr+1))::jsonb ? 'isPlaceholder' = false
        then jsonb_set(value::jsonb, ('{items,' || nr+1 || '}')::text[], (jsonb_extract_path(value, 'items')->>(nr +1))::jsonb || '{"isPlaceholder": true}'::jsonb, true)
      else
        value
      end as value
    from itemsArrayWithPHAdded
    where jsonb_array_length((value #>'{items}')::jsonb) > (nr+1)
  )
select * into TEMP itemsArrayWithPHAddedTable from itemsArrayWithPHAdded;

select nested, fl_id, nr, jsonb_agg(to_json(value)) as value into TEMP uniqueFLmultiitemsWithPHArray
from itemsArrayWithPHAddedTable
where jsonb_array_length((value #>'{items}')::jsonb) = (nr+1) and nested = 'yes'
group by nested, fl_id, nr;

select nested, fl_id, nr, value into TEMP uniqueFLitemsWithPHArray
from itemsArrayWithPHAddedTable
where jsonb_array_length((value #>'{items}')::jsonb) = (nr+1) and nested = 'no'
group by nested, fl_id, nr, value;

update factor_level as fl
set value = jsonb_set(fl.value, '{items}', ua.value)
from uniqueFLmultiitemsWithPHArray ua
where ua.fl_id = fl.id;

update factor_level as fl
set value = ua.value
from uniqueFLitemsWithPHArray ua
where ua.fl_id = fl.id;
