SELECT audit.audit_table(tables.table_name)
FROM (
       SELECT table_catalog, table_schema, table_name FROM information_schema.tables where table_schema not in ('audit', 'pg_catalog', 'information_schema')
       and table_name not in ('unit')
     )  as tables ;