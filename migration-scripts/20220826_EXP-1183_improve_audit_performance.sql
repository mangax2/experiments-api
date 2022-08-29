-- Create more normalized tables so we can store table/transaction level data in one table and row data in a second
-- This prevents us from repeatedly logging the same query for multiple rows

CREATE TABLE IF NOT EXISTS audit.logged_table_transaction
(
    id BIGSERIAL,
    schema_name text COLLATE pg_catalog."default" NOT NULL,
    table_name text COLLATE pg_catalog."default" NOT NULL,
    relid oid NOT NULL,
    session_user_name text COLLATE pg_catalog."default",
    action_tstamp_tx timestamp with time zone NOT NULL,
    action_tstamp_stm timestamp with time zone NOT NULL,
    action_tstamp_clk timestamp with time zone NOT NULL,
    transaction_id bigint,
    application_name text COLLATE pg_catalog."default",
    client_addr inet,
    client_port integer,
    client_query text COLLATE pg_catalog."default" NOT NULL,
    action character(1) COLLATE pg_catalog."default" NOT NULL,
    statement_only boolean NOT NULL,
    username text COLLATE pg_catalog."default",
    audit_reason_code text COLLATE pg_catalog."default",
    audit_comment text COLLATE pg_catalog."default",
    CONSTRAINT logged_table_transaction_pkey PRIMARY KEY (id),
    CONSTRAINT logged_table_transaction_action_check CHECK (action = ANY (ARRAY['I'::bpchar, 'D'::bpchar, 'U'::bpchar, 'T'::bpchar]))
);

CREATE TABLE IF NOT EXISTS audit.logged_row_change (
    logged_table_transaction_id BIGINT,
    row_data hstore,
    changed_fields hstore,
    CONSTRAINT logged_row_change_logged_table_transaction_id_fkey FOREIGN KEY (logged_table_transaction_id)
        REFERENCES audit.logged_table_transaction (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE audit.logged_table_transaction TO auto_sql_user;
GRANT INSERT ON TABLE audit.logged_table_transaction TO experiments_app_user;
GRANT SELECT ON TABLE audit.logged_table_transaction TO experiments_ro_user;
GRANT ALL ON TABLE audit.logged_table_transaction TO experiments_user_s;

GRANT ALL ON TABLE audit.logged_row_change TO auto_sql_user;
GRANT INSERT ON TABLE audit.logged_row_change TO experiments_app_user;
GRANT SELECT ON TABLE audit.logged_row_change TO experiments_ro_user;
GRANT ALL ON TABLE audit.logged_row_change TO experiments_user_s;


CREATE INDEX IF NOT EXISTS logged_table_transaction_action_idx
    ON audit.logged_table_transaction USING btree
    (action COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS logged_table_transaction_action_tstamp_tx_stm_idx
    ON audit.logged_table_transaction USING btree
    (action_tstamp_stm ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS logged_table_transaction_relid_idx
    ON audit.logged_table_transaction USING btree
    (relid ASC NULLS LAST)
    TABLESPACE pg_default;



-- Modify the function that performs the actual logging so that it works at a statement level instead of a row level

CREATE OR REPLACE FUNCTION audit.if_modified_func()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF SECURITY DEFINER
    SET search_path=pg_catalog, public
AS $BODY$
DECLARE
  audit_transaction      audit.logged_table_transaction;
  excluded_cols  TEXT [] = ARRAY [] :: TEXT [];
  audit_info     hstore;
BEGIN

  SELECT audit.get_audit_info() INTO audit_info;

  IF TG_WHEN <> 'AFTER'
  THEN
    RAISE EXCEPTION 'audit.if_modified_func() may only run as an AFTER trigger';
  END IF;

  audit_transaction = ROW (
              NEXTVAL('audit.logged_table_transaction_id_seq'), -- event_id
                TG_TABLE_SCHEMA :: TEXT, -- schema_name
                TG_TABLE_NAME :: TEXT, -- table_name
                TG_RELID, -- relation OID for much quicker searches
                session_user :: TEXT, -- session_user_name
                CURRENT_TIMESTAMP, -- action_tstamp_tx
                statement_timestamp(), -- action_tstamp_stm
                clock_timestamp(), -- action_tstamp_clk
                txid_current(), -- transaction ID
                (SELECT setting
                 FROM pg_settings
                 WHERE name = 'application_name'),
                inet_client_addr(), -- client_addr
              inet_client_port(), -- client_port
              current_query(), -- top-level query or queries (if multistatement) from client
              SUBSTRING(TG_OP, 1, 1), -- action
              'f',                                          -- statement_only
              audit_info -> 'username',
              audit_info -> 'audit_reason_code',
              audit_info -> 'audit_comment'
  );

  IF NOT TG_ARGV [0] :: BOOLEAN IS DISTINCT FROM 'f' :: BOOLEAN
  THEN
    audit_transaction.client_query = '';
  END IF;

  IF TG_ARGV [1] IS NOT NULL AND TG_ARGV [1] <> 'null'
  THEN
    excluded_cols = TG_ARGV [1] :: TEXT [];
  END IF;
  
  IF TG_ARGV [2] :: BOOLEAN IS DISTINCT FROM 'f' :: BOOLEAN
  THEN
      audit_transaction.statement_only = 't';
  END IF;
  
  INSERT INTO audit.logged_table_transaction VALUES (audit_transaction.*);

  IF TG_ARGV[2] :: BOOLEAN IS DISTINCT FROM 'f' :: BOOLEAN
    THEN
      -- we should only log the table action, not the row change
  ELSIF (TG_OP = 'UPDATE')
    THEN
      INSERT INTO audit.logged_row_change
      SELECT audit_transaction.id, hstore(n.*) - excluded_cols, (hstore(n.*) - hstore(o.*)) - excluded_cols
      FROM new_table n
        INNER JOIN old_table o
            ON n.id = o.id
      WHERE ((hstore(n.*) - hstore(o.*)) - excluded_cols) <> hstore('');
  ELSIF (TG_OP = 'DELETE')
    THEN
      INSERT INTO audit.logged_row_change
      SELECT audit_transaction.id, hstore(old_table.*) - excluded_cols, null
      FROM old_table;
  ELSIF (TG_OP = 'INSERT')
    THEN
      INSERT INTO audit.logged_row_change
      SELECT audit_transaction.id, hstore(new_table.*) - excluded_cols, null
      FROM new_table;
  ELSE
    RAISE EXCEPTION '[audit.if_modified_func] - Trigger func added as trigger for unhandled case: %, %', TG_OP, TG_LEVEL;
    RETURN NULL;
  END IF;
  RETURN NULL;
END;
$BODY$;

ALTER FUNCTION audit.if_modified_func()
    OWNER TO experiments_user_s;



-- Replace the function that will create the triggers so they are all statement triggers and not row triggers

CREATE OR REPLACE FUNCTION audit.audit_table(
	target_table regclass,
	audit_rows boolean,
	audit_query_text boolean,
	ignored_cols text[])
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
  DECLARE
    stm_targets        TEXT = 'INSERT OR UPDATE OR DELETE OR TRUNCATE';
    _q_txt             TEXT;
    _ignored_cols_snip TEXT = ', NULL';
  BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_row ON ' || quote_ident(target_table :: TEXT);
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_stm ON ' || quote_ident(target_table :: TEXT);
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_stm_insert ON ' || quote_ident(target_table :: TEXT);
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_stm_update ON ' || quote_ident(target_table :: TEXT);
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_stm_delete ON ' || quote_ident(target_table :: TEXT);

    IF audit_rows
    THEN
      IF array_length(ignored_cols, 1) > 0
      THEN
        _ignored_cols_snip = ', ' || quote_literal(ignored_cols);
      END IF;
      _q_txt = 'CREATE TRIGGER audit_trigger_stm_insert AFTER INSERT ON ' ||
               quote_ident(target_table :: TEXT) ||
               ' REFERENCING NEW TABLE AS new_table FOR EACH STATEMENT EXECUTE PROCEDURE audit.if_modified_func(' ||
               quote_literal(audit_query_text) || _ignored_cols_snip || ', ''false'');' ||
               'CREATE TRIGGER audit_trigger_stm_update AFTER UPDATE ON ' ||
               quote_ident(target_table :: TEXT) ||
               ' REFERENCING OLD TABLE AS old_table NEW TABLE AS new_table FOR EACH STATEMENT EXECUTE PROCEDURE audit.if_modified_func(' ||
               quote_literal(audit_query_text) || _ignored_cols_snip || ', ''false'');' ||
               'CREATE TRIGGER audit_trigger_stm_delete AFTER DELETE ON ' ||
               quote_ident(target_table :: TEXT) ||
               ' REFERENCING OLD TABLE AS old_table FOR EACH STATEMENT EXECUTE PROCEDURE audit.if_modified_func(' ||
               quote_literal(audit_query_text) || _ignored_cols_snip || ', ''false'');';
      RAISE NOTICE '%', _q_txt;
      EXECUTE _q_txt;
      stm_targets = 'TRUNCATE';
    ELSE
    END IF;

    _q_txt = 'CREATE TRIGGER audit_trigger_stm AFTER ' || stm_targets || ' ON ' ||
             quote_ident(target_table :: TEXT) ||
             ' FOR EACH STATEMENT EXECUTE PROCEDURE audit.if_modified_func(' ||
             quote_literal(audit_query_text) || ', NULL, ''true'');';
    RAISE NOTICE '%', _q_txt;
    EXECUTE _q_txt;

  END;
  
$BODY$;

ALTER FUNCTION audit.audit_table(regclass, boolean, boolean, text[])
    OWNER TO experiments_user_s;

COMMENT ON FUNCTION audit.audit_table(regclass, boolean, boolean, text[])
    IS '
ADD auditing support TO a TABLE.
 
Arguments:
   target_table:     TABLE name, schema qualified IF NOT ON search_path
   audit_rows:       Record each ROW CHANGE, OR ONLY audit at a statement level
   audit_query_text: Record the text OF the client query that triggered the audit event?
   ignored_cols:     COLUMNS TO exclude FROM UPDATE diffs, IGNORE updates that CHANGE ONLY ignored cols.
';



-- Set up the new triggers on all the tables (yes, even including the unit table)
SELECT audit.audit_table(tables.table_name :: TEXT)
FROM (
    SELECT table_catalog, table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
)  as tables ;