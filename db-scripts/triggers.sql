CREATE OR REPLACE FUNCTION trigger_on_factor()
  RETURNS trigger AS
$$
BEGIN

IF(TG_OP = 'INSERT') THEN
INSERT INTO factor_new(id,name,ref_factor_type_id,experiment_id,ref_data_source_id,tier,created_user_id,created_date,modified_user_id,modified_date)
VALUES (OLD.id,OLD.name,OLD.ref_factor_type_id,OLD.experiment_id,OLD.ref_data_source_id,
	OLD.tier,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date);
END IF;
IF(TG_OP = 'UPDATE') THEN
UPDATE factor_new  SET (name,ref_factor_type_id,experiment_id,ref_data_source_id,tier,created_user_id,created_date,modified_user_id,modified_date) = (OLD.name,OLD.ref_factor_type_id,OLD.experiment_id,OLD.ref_data_source_id,
	OLD.tier,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date)  WHERE OLD.id = factor_new.id ;
END IF;
IF(TG_OP = 'DELETE') THEN
DELETE FROM factor_new WHERE factor_new.id = OLD.id;
END IF;
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
begin
  IF  (SELECT ref_data_source_id FROM factor WHERE id=$2)=3  AND isNumeric($1) then
       return  jsonb_build_object('refId',$1);
  ELSE
    return jsonb_build_object('text',$1);
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_on_factor_level()
  RETURNS trigger AS
$$
BEGIN

IF(TG_OP = 'INSERT') THEN
INSERT INTO factor_level_new(id,value,factor_id,created_user_id,created_date,modified_user_id,modified_date)
VALUES (OLD.id,factor_level_value_check(OLD.value,OLD.factor_id),OLD.factor_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date);
END IF;
IF(TG_OP = 'UPDATE') THEN
UPDATE factor_level_new  SET (value,factor_id,created_user_id,created_date,modified_user_id,modified_date) = (factor_level_value_check(OLD.value,OLD.factor_id),OLD.factor_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date)  WHERE factor_level_new.id = OLD.id ;
END IF;
IF(TG_OP = 'DELETE') THEN
DELETE FROM factor_level_new WHERE factor_level_new.id = OLD.id;
END IF;
END;
$$
LANGUAGE plpgsql ;

CREATE TRIGGER trigger_on_factor_level
  AFTER INSERT OR UPDATE OR DELETE
  ON factor_level
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_on_factor_level();
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION  combination_element_factor_level_id(name text ,value text,treatment_id integer) RETURNS integer AS $$
BEGIN
    SELECT id FROM factor_level WHERE factor_id = (SELECT id FROM factor WHERE experiment_id = (SELECT experiment_id FROM treatment WHERE id = $3) AND name = $1) AND value = $2;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_on_combination_element()
  RETURNS trigger AS
$$
BEGIN

IF(TG_OP = 'INSERT') THEN
INSERT INTO combination_element_new(id,factor_level_id,treatment_id,created_user_id,created_date,modified_user_id,modified_date)
VALUES (OLD.id,combination_element_factor_level_id(OLD.name,OLD.value,OLD.treatment_id),OLD.treatment_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date);
END IF;
IF(TG_OP = 'UPDATE') THEN
UPDATE combination_element_new  SET (factor_level_id,treatment_id,created_user_id,created_date,modified_user_id,modified_date) = (combination_element_factor_level_id(OLD.name,OLD.value,OLD.treatment_id),OLD.treatment_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date)   WHERE combination_element_new.id = OLD.id;
END IF;
IF(TG_OP = 'DELETE') THEN
DELETE FROM combination_element_new WHERE combination_element_new.id = OLD.id;
END IF;
END;
$$
LANGUAGE plpgsql ;

CREATE TRIGGER trigger_on_combination_element
  AFTER INSERT OR UPDATE OR DELETE
  ON combination_element
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_on_combination_element();
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION  group_value_factor_level_id(name text ,value text,group_id integer) RETURNS TABLE(name1 text ,value1 text,factor_level_id integer) AS
$$
DECLARE x INTEGER ;
BEGIN
  x = (SELECT id FROM factor_level WHERE factor_id = (SELECT id FROM factor WHERE experiment_id = (SELECT experiment_id FROM "group" WHERE id = $3) AND factor.name = $1) AND factor_level.value = $2);
  --raise notice 'Value: %', x;
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
INSERT INTO group_value_new(id,name,value,factor_level_id,group_id,created_user_id,created_date,modified_user_id,modified_date)
VALUES (OLD.id,group_value_factor_level_id(OLD.name,OLD.value,OLD.group_id),OLD.group_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date);
END IF;
IF(TG_OP = 'UPDATE') THEN
BEGIN
GV = group_value_factor_level_id(OLD.name,OLD.value,OLD.group_id);
UPDATE group_value_new  SET (name,value,factor_level_id,group_id,created_user_id,created_date,modified_user_id,modified_date) = (GV.name1,GV.value1,GV.factor_level_id,OLD.group_id,OLD.created_user_id,OLD.created_date,OLD.modified_user_id,OLD.modified_date)  WHERE group_value_new.id = OLD.id ;
END;
END IF;
IF(TG_OP = 'DELETE') THEN
DELETE FROM group_value_new WHERE group_value_new.id = OLD.id;
END IF;
END;
$$
LANGUAGE plpgsql ;

CREATE TRIGGER trigger_on_group_value
  AFTER INSERT OR UPDATE OR DELETE
  ON group_value
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_on_group_value();


