CREATE TABLE graphql_audit(
  raw VARCHAR NOT NULL,
  parsed jsonb[],
  request_time timestamp with time zone NOT NULL,
  client_id VARCHAR (150) NOT NULL,
  user_id VARCHAR (20)
);

CREATE OR REPLACE FUNCTION process_graphql_audit()
  RETURNS trigger AS
$BODY$
BEGIN
  DELETE FROM graphql_audit WHERE request_time < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;

CREATE TRIGGER purge_graphql_audit
AFTER INSERT ON graphql_audit
FOR EACH ROW EXECUTE PROCEDURE process_graphql_audit();
