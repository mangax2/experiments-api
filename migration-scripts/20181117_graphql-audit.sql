CREATE TABLE audit.graphql_audit(
  raw VARCHAR NOT NULL,
  parsed jsonb[],
  request_time timestamp with time zone NOT NULL,
  client_id VARCHAR NOT NULL,
  user_id VARCHAR
);

CREATE OR REPLACE FUNCTION process_graphql_audit()
  RETURNS trigger AS
$BODY$
BEGIN
  DELETE FROM audit.graphql_audit WHERE request_time < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;

CREATE TRIGGER purge_graphql_audit
AFTER INSERT ON audit.graphql_audit
FOR EACH ROW EXECUTE PROCEDURE process_graphql_audit();
