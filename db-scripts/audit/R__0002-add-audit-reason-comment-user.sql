CREATE OR REPLACE function audit.add_column_if_not_exists(_tbl regclass, _col  text, _type regtype)
  RETURNS bool AS
$func$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_attribute
  WHERE  attrelid = _tbl
         AND    attname = _col
         AND    NOT attisdropped) THEN
    RETURN FALSE;
  ELSE
    EXECUTE format('ALTER TABLE %s ADD COLUMN %I %s', _tbl, _col, _type);
    RETURN TRUE;
  END IF;
END
$func$  LANGUAGE plpgsql;

select audit.add_column_if_not_exists('audit.logged_actions', 'username', 'TEXT');
select audit.add_column_if_not_exists('audit.logged_actions', 'audit_reason_code', 'TEXT');
select audit.add_column_if_not_exists('audit.logged_actions', 'audit_comment', 'TEXT');

CREATE OR REPLACE FUNCTION audit.create_transaction_info_temp_table()
  RETURNS VOID
LANGUAGE plpgsql
AS
$body$
DECLARE
BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS transaction_info (
    audit_info HSTORE
  ) ON COMMIT DELETE ROWS;
END;
$body$;

CREATE OR REPLACE FUNCTION audit.capture_audit_info(username TEXT, audit_reason_code TEXT, audit_comment TEXT)
 RETURNS VOID
 SECURITY DEFINER
LANGUAGE plpgsql
AS
$body$
DECLARE
  audit_info HSTORE;
BEGIN
  EXECUTE audit.create_transaction_info_temp_table();

  DELETE FROM transaction_info;

  audit_info = hstore('username', username :: TEXT);
  audit_info = audit_info || hstore('audit_reason_code', audit_reason_code :: TEXT);
  audit_info = audit_info || hstore('audit_comment', audit_comment :: TEXT);

  INSERT INTO transaction_info VALUES (audit_info);
END;
$body$;

CREATE OR REPLACE FUNCTION audit.get_audit_info()
  RETURNS hstore
LANGUAGE plpgsql
AS
$body$
DECLARE
  audit_info HSTORE;
BEGIN

  EXECUTE audit.create_transaction_info_temp_table();

  SELECT transaction_info.audit_info
  FROM transaction_info
  INTO audit_info;

  IF (audit_info IS NULL)
  THEN
    audit_info = hstore(ROW ());
  END IF;

  RETURN audit_info;
END;
$body$;



CREATE OR REPLACE FUNCTION audit.if_modified_func()
  RETURNS TRIGGER AS $body$
DECLARE
  audit_row      audit.logged_actions;
  include_values BOOLEAN;
  log_diffs      BOOLEAN;
  h_old          hstore;
  h_new          hstore;
  excluded_cols  TEXT [] = ARRAY [] :: TEXT [];
  audit_info     hstore;
BEGIN

  SELECT audit.get_audit_info() INTO audit_info;

  IF TG_WHEN <> 'AFTER'
  THEN
    RAISE EXCEPTION 'audit.if_modified_func() may only run as an AFTER trigger';
  END IF;

  audit_row = ROW (
              NEXTVAL('audit.logged_actions_event_id_seq'), -- event_id
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
              NULL, NULL, -- row_data, changed_fields
              'f',                                          -- statement_only
              audit_info -> 'username',
              audit_info -> 'audit_reason_code',
              audit_info -> 'audit_comment'
  );

  IF NOT TG_ARGV [0] :: BOOLEAN IS DISTINCT FROM 'f' :: BOOLEAN
  THEN
    audit_row.client_query = NULL;
  END IF;

  IF TG_ARGV [1] IS NOT NULL
  THEN
    excluded_cols = TG_ARGV [1] :: TEXT [];
  END IF;

  IF (TG_OP = 'UPDATE' AND TG_LEVEL = 'ROW')
  THEN
    audit_row.row_data = hstore(OLD.*);
    audit_row.changed_fields = (hstore(NEW.*) - audit_row.row_data) - excluded_cols;
    IF audit_row.changed_fields = hstore('')
    THEN
      -- All changed fields are ignored. Skip this update.
      RETURN NULL;
    END IF;
  ELSIF (TG_OP = 'DELETE' AND TG_LEVEL = 'ROW')
    THEN
      audit_row.row_data = hstore(OLD.*) - excluded_cols;
  ELSIF (TG_OP = 'INSERT' AND TG_LEVEL = 'ROW')
    THEN
      audit_row.row_data = hstore(NEW.*) - excluded_cols;
  ELSIF (TG_LEVEL = 'STATEMENT' AND TG_OP IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'))
    THEN
      audit_row.statement_only = 't';
  ELSE
    RAISE EXCEPTION '[audit.if_modified_func] - Trigger func added as trigger for unhandled case: %, %', TG_OP, TG_LEVEL;
    RETURN NULL;
  END IF;
  INSERT INTO audit.logged_actions VALUES (audit_row.*);
  RETURN NULL;
END;
$body$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public;


COMMENT ON FUNCTION audit.if_modified_func() IS $body$
Track changes TO a TABLE at the statement AND/OR ROW level.

Optional parameters TO TRIGGER IN CREATE TRIGGER CALL:

param 0: BOOLEAN, whether TO log the query text. DEFAULT 't'.

param 1: text[], COLUMNS TO IGNORE IN updates. DEFAULT [].

         Updates TO ignored cols are omitted FROM changed_fields.

         Updates WITH ONLY ignored cols changed are NOT inserted
         INTO the audit log.

         Almost ALL the processing WORK IS still done FOR updates
         that ignored. IF you need TO save the LOAD, you need TO USE
         WHEN clause ON the TRIGGER instead.

         No warning OR error IS issued IF ignored_cols contains COLUMNS
         that do NOT exist IN the target TABLE. This lets you specify
         a standard SET OF ignored COLUMNS.

There IS no parameter TO disable logging OF VALUES. ADD this TRIGGER AS
a 'FOR EACH STATEMENT' rather than 'FOR EACH ROW' TRIGGER IF you do NOT
want TO log ROW VALUES.

Note that the USER name logged IS the login ROLE FOR the SESSION. The audit TRIGGER
cannot obtain the active ROLE because it IS reset BY the SECURITY DEFINER invocation
OF the audit TRIGGER its SELF.
$body$;


-- Allow the application user (or any other user) to capture audit information

GRANT USAGE ON SCHEMA audit TO PUBLIC;
GRANT EXECUTE ON FUNCTION audit.capture_audit_info(TEXT, TEXT, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION audit.create_transaction_info_temp_table() TO PUBLIC;