SELECT audit.audit_table(tables.table_name)
FROM (
       SELECT table_catalog, table_schema, table_name FROM information_schema.tables where table_schema = 'public'
       and table_name not in ('unit')
     )  as tables ;