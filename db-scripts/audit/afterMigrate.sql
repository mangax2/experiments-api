-- add

SELECT audit.audit_table(tables.table_name)
FROM (
       SELECT table_catalog, table_schema, table_name FROM information_schema.tables where table_schema not in ('audit', 'pg_catalog', 'information_schema')
       and table_name  not in ('experiment_summary', 'group', 'unit')
     )  as tables ;

--Run only above script when new tables are added

 DROP TRIGGER audit_trigger_row ON public."group";
 DROP TRIGGER audit_trigger_stm ON public."group";

CREATE TRIGGER audit_trigger_row
  AFTER  UPDATE OR DELETE
  ON public."group"
  FOR EACH ROW
  EXECUTE PROCEDURE audit.if_modified_func('true');

CREATE TRIGGER audit_trigger_stm
  AFTER TRUNCATE
  ON public."group"
  FOR EACH STATEMENT
  EXECUTE PROCEDURE audit.if_modified_func('true');