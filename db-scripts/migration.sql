------------------------------
---Migartion Scripts
INSERT INTO factor_new(id,name,ref_factor_type_id,experiment_id,ref_data_source_id,tier,created_user_id,created_date,modified_user_id,modified_date)
SELECT id,name,ref_factor_type_id,experiment_id,ref_data_source_id,tier,created_user_id,created_date,modified_user_id,modified_date FROM factor
----2.Copy data from factor_level to factor_level_new
CREATE OR REPLACE FUNCTION isnumeric(text) RETURNS BOOLEAN AS $$
DECLARE x NUMERIC;
BEGIN
    x = $1::NUMERIC;
    RETURN TRUE;
EXCEPTION WHEN others THEN
    RETURN FALSE;
END;
$$
LANGUAGE plpgsql ;

create or replace function factor_level_value_check(value text ,factor_id integer) returns jsonb as
$$
begin
  if ( (select ref_data_source_id from factor where id=$2)=3  AND isNumeric($1) then
       return  jsonb_build_object('refId',$1);
  else
    return jsonb_build_object('text',$1);
  end if;
end;
$$ LANGUAGE plpgsql;


INSERT INTO factor_level_new(id,value,factor_id,created_user_id,created_date,modified_user_id,modified_date)
select id,factor_level_value_check(value,factor_id),factor_id,created_user_id,created_date,modified_user_id,modified_date FROM factor_level;

DROP FUNCTION isnumeric;
DROP FUNCTION factor_level_value_check;
-----------------------------------------------------
--Copy data from combination_element to combination_element_new
---select distinct(experiment_id) from treatment where id in (select distinct(treatment_id) from combination_element where value = '')
create or replace function  combination_element_factor_level_id(name text ,value text,treatment_id integer) returns integer AS $$
    SELECT id from factor_level where factor_id = (select id from factor where experiment_id = (select experiment_id from treatment where id = $3) and name = $1) and value = $2;
$$ LANGUAGE plpgsql;

INSERT INTO combination_element_new(id,factor_level_id,treatment_id,created_user_id,created_date,modified_user_id,modified_date)
select id,combination_element_factor_level_id(name,value,treatment_id),treatment_id,
created_user_id,created_date,modified_user_id,modified_date from combination_element;

DROP FUNCTION combination_element_factor_level_id;
----------------------------------------------------------
--Copy Data from group_value to group_value_new
create or replace function  group_value_factor_level_id(name text ,value text,group_id integer) returns TABLE(name1 text ,value1 text,factor_level_id integer) AS
$$
declare x integer ;
BEGIN
  x = (SELECT id from factor_level where factor_id = (select id from factor where experiment_id = (select experiment_id from "group" where id = $3) and factor.name = $1) and factor_level.value = $2);
  --raise notice 'Value: %', x;
  if (x is null) then
  RETURN QUERY select $1,$2,COALESCE(x);
  else
  return QUERY select COALESCE(NULL),COALESCE(NULL),x;
  end if;
 END
$$ LANGUAGE plpgsql;

INSERT INTO group_value_new(id,name,value,factor_level_id,group_id,created_user_id,created_date,modified_user_id,modified_date)
select id,group_value_factor_level_id(name,value,group_id),group_id,created_user_id,created_date,
modified_user_id,modified_date from group_value;

DROP function group_value_factor_level_id;
---------------------------------------------------------------
ALTER SEQUENCE factor_id_seq OWNED BY factor_new;
DROP TABLE public.factor;
ALTER TABLE public.factor_new RENAME TO factor;
ALTER TABLE factor RENAME CONSTRAINT factor_new_pk TO factor_pk;
ALTER TABLE factor RENAME CONSTRAINT factor_new_ak_1 TO factor_ak_1;


ALTER SEQUENCE factor_level_id_seq OWNED BY factor_level_new;
DROP TABLE public.factor_level;
ALTER TABLE public.factor_level_new RENAME TO factor_level;
ALTER TABLE factor_level RENAME CONSTRAINT factor_level_new_pk TO factor_level_pk;
ALTER TABLE factor_level RENAME CONSTRAINT factor_level_new_ak_1 TO factor_level_ak_1;
ALTER TABLE factor_level RENAME CONSTRAINT factor_level_new_factor_id_fkey TO
factor_level_factor_id_fkey;



ALTER SEQUENCE combination_element_id_seq OWNED BY combination_element_new;
DROP TABLE public.combination_element;
ALTER TABLE public.combination_element_new RENAME TO combination_element;
ALTER TABLE combination_element RENAME CONSTRAINT combination_element_new_pk TO
combination_element_pk;
ALTER TABLE combination_element RENAME CONSTRAINT combination_element_new_ak_1 TO
combination_element_ak_1;
ALTER TABLE combination_element RENAME CONSTRAINT combination_element_new_factor_level_id_fkey TO
 combination_element_factor_level_id_fkey;
ALTER TABLE combination_element RENAME INDEX combination_element_new_treatment_id TO
combination_element_treatment_id;

ALTER SEQUENCE group_value_id_seq OWNED BY group_value_new
DROP TABLE public.group_value;
ALTER TABLE public.group_value_new RENAME TO group_value;
ALTER TABLE group_value RENAME CONSTRAINT group_value_new_pk TO group_value_pk;
ALTER TABLE group_value RENAME CONSTRAINT group_value_new_factor_level_id_fkey TO
group_value_factor_level_id_fkey;
ALTER TABLE group_value RENAME INDEX group_value_new_group_id TO group_value_group_id;


