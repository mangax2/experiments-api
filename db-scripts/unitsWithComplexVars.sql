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