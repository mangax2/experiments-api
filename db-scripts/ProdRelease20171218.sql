-- Create new level object type table
create table ref_level_object_type
(
    id serial not null constraint ref_level_object_type_pk primary key,
    name varchar not null constraint ref_level_object_type_ak unique,
    created_user_id varchar not null,
    created_date timestamp with time zone not null,
    modified_user_id varchar not null,
    modified_date timestamp with time zone not null
);

-- Set permissions to the new table
ALTER TABLE public.ref_level_object_type OWNER TO experiments_user_s;
GRANT ALL ON TABLE public.ref_level_object_type TO experiments_user_s;
GRANT SELECT ON TABLE public.ref_level_object_type TO experiments_ro_user;
GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE public.ref_level_object_type TO experiments_dev_app_user;

-- Populate the table
insert into ref_level_object_type(name, created_user_id, created_date, modified_user_id, modified_date) values('Catalog', 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);
insert into ref_level_object_type(name, created_user_id, created_date, modified_user_id, modified_date) values('Other', 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);
insert into ref_level_object_type(name, created_user_id, created_date, modified_user_id, modified_date) values('Cluster', 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);
insert into ref_level_object_type(name, created_user_id, created_date, modified_user_id, modified_date) values('Composite', 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

-- Add ref_id to ref_data_source table
alter table ref_data_source add column ref_id varchar;
alter table ref_data_source add constraint ref_data_source_ak_2 unique(ref_id);

-- Add new catalogs to ref_data_source
insert into ref_data_source(name, ref_id, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Chemical Catalog', 'CHEMICAL', (select id from ref_data_source_type where type = 'Catalog'), 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

insert into ref_data_source(name, ref_id, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Plant Sample Catalog', 'PLANT_SAMPLE', (select id from ref_data_source_type where type = 'Catalog'), 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

insert into ref_data_source(name, ref_id, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Protein Catalog', 'PROTEIN', (select id from ref_data_source_type where type = 'Catalog'), 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

insert into ref_data_source(name, ref_id, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Container Catalog', 'CONTAINER', (select id from ref_data_source_type where type = 'Catalog'), 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

insert into ref_data_source(name, ref_id, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Internal Seed Catalog', 'INTERNAL_SEED', (select id from ref_data_source_type where type = 'Catalog'), 'PNWATT', current_timestamp, 'PNWATT', current_timestamp);

update ref_data_source set ref_id = 'FORMULATION_CATALOG' where id in (select id from ref_data_source where name = 'Formulation Catalog');

-- Add objectType of Cluster to the root value objects
update factor_level set value = jsonb_set(value, '{objectType}', '"Cluster"')
where id in (select id from factor_level where (value ? 'items'));

-- Add objectType of Composite to composites using function
create or replace function setObjectTypeComposite(clusterArray jsonb)
  returns jsonb language plpgsql as $$
declare
  currentComposite jsonb;
  newClusterArray jsonb;
begin
  newClusterArray = '[]'::jsonb;
  for currentComposite in select * from jsonb_array_elements(clusterArray)
  loop
    if currentComposite ? 'items' then
      newClusterArray = newClusterArray || jsonb_set(currentComposite, '{objectType}', '"Composite"');
    else
      newClusterArray = newClusterArray || currentComposite;
    end if;
  end loop;
  return newClusterArray;
end;
$$;

update factor_level set value = jsonb_set(value, '{items}', setObjectTypeComposite(value->'items'))
where jsonb_typeof(value->'items') = 'array';

drop function setObjectTypeComposite(jsonb);


-- Create function to aid in adding objectType to objects in clusters.
create or replace function setItemTypesInObjects(objectArray jsonb, propertyTypeName varchar, propKey text[], propValue jsonb)
  returns jsonb language plpgsql as $$
declare
  currentObject jsonb;
  newObjectArray jsonb;
  propertyTypeId int;
begin
  newObjectArray = '[]'::jsonb;
  select ds.id into propertyTypeId from ref_data_source ds where ds.name = propertyTypeName;
  for currentObject in select * from jsonb_array_elements(objectArray)
  loop
    if currentObject ? 'propertyTypeId' and (currentObject ->> 'propertyTypeId')::int = propertyTypeId then
      newObjectArray = newObjectArray || jsonb_set(currentObject, propKey, propValue);
    else
      newObjectArray = newObjectArray || currentObject;
    end if;
  end loop;
  return newObjectArray;
end;
$$;

-- Set object type of other
update factor_level set value = jsonb_set(value, '{items}', setItemTypesInObjects(value -> 'items', 'None', '{objectType}'::text[], '"Other"'))
WHERE jsonb_typeof(value -> 'items') = 'array';

-- Set object type of catalog
update factor_level set value = jsonb_set(value, '{items}', setItemTypesInObjects(value -> 'items', 'Formulation Catalog', '{objectType}'::text[], '"Catalog"'))
WHERE jsonb_typeof(value -> 'items') = 'array';

-- Set catalog
update factor_level set value = jsonb_set(value, '{items}', setItemTypesInObjects(value -> 'items', 'Formulation Catalog', '{catalogType}'::text[], '"FORMULATION_CATALOG"'))
WHERE jsonb_typeof(value -> 'items') = 'array';

-- Create function to aid in adding objectType to objects in composites.
create or replace function setItemTypesInCompositeObjects(clusterArray jsonb, propertyTypeName varchar, propKey text[], propValue jsonb)
  returns jsonb language plpgsql as $$
declare
  currentComposite jsonb;
  newClusterArray jsonb;
begin
  newClusterArray = '[]'::jsonb;
  for currentComposite in select * from jsonb_array_elements(clusterArray)
  loop
    if currentComposite ? 'items' then
      newClusterArray = newClusterArray || jsonb_set(currentComposite, '{items}', setItemTypesInObjects(currentComposite -> 'items', propertyTypeName, propKey, propValue));
    else
      newClusterArray = newClusterArray || currentComposite;
    end if;
  end loop;
  return newClusterArray;
end;
$$;

-- Set object type of other
update factor_level set value = jsonb_set(value, '{items}', setItemTypesInCompositeObjects(value -> 'items', 'None', '{objectType}'::text[], '"Other"'))
WHERE jsonb_typeof(value -> 'items') = 'array';

-- Set object type of catalog
update factor_level set value = jsonb_set(value, '{items}', setItemTypesInCompositeObjects(value -> 'items', 'Formulation Catalog', '{objectType}'::text[], '"Catalog"'))
WHERE jsonb_typeof(value -> 'items') = 'array';

-- Set catalog
update factor_level set value = jsonb_set(value, '{items}', setItemTypesInCompositeObjects(value -> 'items', 'Formulation Catalog', '{catalogType}'::text[], '"FORMULATION_CATALOG"'))
WHERE jsonb_typeof(value -> 'items') = 'array';

drop function setItemTypesInCompositeObjects(jsonb, varchar, text[], jsonb);
drop function setItemTypesInObjects(jsonb, varchar, text[], jsonb);