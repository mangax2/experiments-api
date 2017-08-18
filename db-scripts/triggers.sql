CREATE OR REPLACE FUNCTION trigger_on_factor()
  RETURNS trigger AS
$$
BEGIN

IF(TG_OP = 'INSERT') THEN
INSERT INTO factor_new(id,name,ref_factor_type_id,experiment_id,ref_data_source_id,tier,created_user_id,created_date,modified_user_id,modified_date)
VALUES (NEW.id,NEW.name,NEW.ref_factor_type_id,NEW.experiment_id,NEW.ref_data_source_id,
	NEW.tier,NEW.created_user_id,NEW.created_date,NEW.modified_user_id,NEW.modified_date);
END IF;
IF(TG_OP = 'UPDATE') THEN
UPDATE factor_new  SET (name,ref_factor_type_id,experiment_id,ref_data_source_id,tier,created_user_id,created_date,modified_user_id,modified_date) = (OLD.name,OLD.ref_factor_type_id,OLD.experiment_id,OLD.ref_data_source_id,
	OLD.tier,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date)  WHERE OLD.id = factor_new.id ;
END IF;
IF(TG_OP = 'DELETE') THEN
DELETE FROM factor_new WHERE factor_new.id = OLD.id;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql ;

CREATE TRIGGER trigger_on_factor
  AFTER INSERT OR UPDATE OR DELETE
  ON factor
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_on_factor();


-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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

CREATE OR REPLACE FUNCTION factor_level_value_check(value text ,factor_id integer) RETURNS jsonb AS
$$
DECLARE isNumericValue BOOLEAN;
begin
  isNumericValue = isNumeric($1);
  if ( (select ref_data_source_id from factor where id=$2)=(select id from ref_data_source where name = 'Formulation Catalog')  AND isNumericValue ) then
    return jsonb_build_object(
        'items', jsonb_build_array(
          jsonb_build_object(
              'label', (select name from factor where id=$2),
              'propertyTypeId', (select id from ref_data_source where name = 'Formulation Catalog'),
              'refId', $1)));
  elseif ( (select ref_data_source_id from factor where id=$2)=(select id from ref_data_source where name = 'Formulation Catalog')  AND NOT isNumericValue ) then
    return jsonb_build_object(
        'items', jsonb_build_array(
          jsonb_build_object(
              'label', (select name from factor where id=$2),
              'propertyTypeId', (select id from ref_data_source where name = 'Formulation Catalog'),
              'text', $1)));
  else
    return jsonb_build_object(
        'items', jsonb_build_array(
          jsonb_build_object(
              'label', (select name from factor where id=$2),
              'propertyTypeId', (select id from ref_data_source where name = 'Other'),
              'text', $1)));
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_on_factor_level()
  RETURNS trigger AS
$$
BEGIN

IF(TG_OP = 'INSERT') THEN
INSERT INTO factor_level_new(id,value,factor_id,created_user_id,created_date,modified_user_id,modified_date)
VALUES (NEW.id,factor_level_value_check(NEW.value,NEW.factor_id),NEW.factor_id,NEW.created_user_id,NEW.created_date,NEW.modified_user_id,NEW.modified_date);
END IF;
IF(TG_OP = 'UPDATE') THEN
UPDATE factor_level_new  SET (value,factor_id,created_user_id,created_date,modified_user_id,modified_date) = (factor_level_value_check(OLD.value,OLD.factor_id),OLD.factor_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date)  WHERE factor_level_new.id = OLD.id ;
END IF;
IF(TG_OP = 'DELETE') THEN
DELETE FROM factor_level_new WHERE factor_level_new.id = OLD.id;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql ;

CREATE TRIGGER trigger_on_factor_level
  AFTER INSERT OR UPDATE OR DELETE
  ON factor_level
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_on_factor_level();
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
create or replace function combination_element_factor_level_id(nameParam text ,valueParam text,treatment_id integer) returns integer AS
$$
declare x integer;
begin
    SELECT id from factor_level where factor_id = (select id from factor where experiment_id = (select experiment_id from treatment where id = $3) and name = $1) and value = $2 into x;
    return x;
end;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trigger_on_combination_element()
  RETURNS trigger AS
$$
DECLARE X integer;
BEGIN
IF(TG_OP = 'INSERT') THEN
BEGIN
X = combination_element_factor_level_id(NEW.name,NEW.value,NEW.treatment_id);
IF(X IS NOT NULL) THEN
INSERT INTO combination_element_new(id,factor_level_id,treatment_id,created_user_id,created_date,modified_user_id,modified_date)
VALUES (NEW.id,X,NEW.treatment_id,NEW.created_user_id,NEW.created_date,NEW.modified_user_id,NEW.modified_date);
END IF;
END;
END IF;
IF(TG_OP = 'UPDATE') THEN
BEGIN
X = combination_element_factor_level_id(OLD.name,OLD.value,OLD.treatment_id);
IF(X IS NOT NULL) THEN
UPDATE combination_element_new  SET (factor_level_id,treatment_id,created_user_id,created_date,modified_user_id,modified_date) = (combination_element_factor_level_id(OLD.name,OLD.value,OLD.treatment_id),OLD.treatment_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date)   WHERE combination_element_new.id = OLD.id;
END IF;
END;
END IF;
IF(TG_OP = 'DELETE') THEN
DELETE FROM combination_element_new WHERE combination_element_new.id = OLD.id;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql ;

CREATE TRIGGER trigger_on_combination_element
  AFTER INSERT OR UPDATE OR DELETE
  ON combination_element
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_on_combination_element();
 ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION  group_value_factor_level_id(name text ,value text,group_id integer) RETURNS TABLE(nameParam text ,valueParam text,factor_level_id integer) AS
$$
declare x integer ;
BEGIN
  x = (SELECT id FROM factor_level WHERE factor_id = (SELECT id FROM factor WHERE experiment_id = (SELECT experiment_id FROM "group" WHERE id = $3) AND factor.name = $1) AND factor_level.value = $2);
  IF (x is null) then
  RETURN QUERY SELECT $1,$2,COALESCE(x);
  ELSE
  RETURN QUERY SELECT COALESCE(NULL),COALESCE(NULL),x;
  END IF;
 END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_on_group_value()
  RETURNS trigger AS
$$
DECLARE GV RECORD;
BEGIN
IF(TG_OP = 'INSERT') THEN
GV = group_value_factor_level_id(NEW.name,NEW.value,NEW.group_id);
INSERT INTO group_value_new(id,name,value,factor_level_id,group_id,created_user_id,created_date,modified_user_id,modified_date)
VALUES (NEW.id,GV.nameParam,GV.valueParam,GV.factor_level_id,NEW.group_id,NEW.created_user_id,NEW.created_date,NEW.modified_user_id,NEW.modified_date);
END IF;
IF(TG_OP = 'UPDATE') THEN
BEGIN
GV = group_value_factor_level_id(OLD.name,OLD.value,OLD.group_id);
UPDATE group_value_new  SET (name,value,factor_level_id,group_id,created_user_id,created_date,modified_user_id,modified_date) = (GV.nameParam,GV.valueParam,GV.factor_level_id,OLD.group_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date)  WHERE group_value_new.id = OLD.id ;
END;
END IF;
IF(TG_OP = 'DELETE') THEN
DELETE FROM group_value_new WHERE group_value_new.id = OLD.id;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql ;

CREATE TRIGGER trigger_on_group_value
  AFTER INSERT OR UPDATE OR DELETE
  ON group_value
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_on_group_value();


