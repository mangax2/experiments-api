ALTER TABLE public.group ADD set_id INTEGER;

INSERT INTO ref_design_spec (name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Rep Dimension X', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO ref_design_spec (name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Rep Dimension Y', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);

create or replace function getNoDataSourceId() returns integer as
$$
declare x integer;
begin
  select id from ref_data_source_type where type = 'I do not have a data source' into x;
  return x;
end;
$$ LANGUAGE plpgsql;

insert into ref_data_source(name, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Custom', getNoDataSourceId(), 'PNWATT', CURRENT_TIMESTAMP, 'PNWATT', CURRENT_TIMESTAMP);

insert into ref_data_source(name, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Composite', getNoDataSourceId(), 'PNWATT', CURRENT_TIMESTAMP, 'PNWATT', CURRENT_TIMESTAMP);

drop function getNoDataSourceId();


CREATE INDEX factor_level_new_factor_id
  ON public.factor_level_new
  USING btree
  (factor_id);

CREATE INDEX combination_element_new_factor_level_id
  ON public.combination_element_new
  USING btree
  (factor_level_id);

CREATE INDEX group_value_new_factor_level_id
  ON public.group_value_new
  USING btree
  (factor_level_id);

CREATE INDEX unit_treatment_id
  ON public.unit
  USING btree
  (treatment_id);

UPDATE ref_data_source SET name='None' WHERE name='Other';