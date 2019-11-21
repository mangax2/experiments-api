insert into ref_data_source(name, ref_id, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Weeds Catalog', 'WEEDS', (select id from ref_data_source_type where type = 'Catalog'), 'migration', current_timestamp, 'migration', current_timestamp);
