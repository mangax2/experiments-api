GRANT SELECT, DELETE ON TABLE audit.graphql_audit TO exp_db_audit_cleanup_user;

DROP TRIGGER IF EXISTS purge_graphql_audit ON audit.graphql_audit;

DROP FUNCTION IF EXISTS process_graphql_audit();

CREATE OR REPLACE PROCEDURE process_graphql_audit()
    LANGUAGE SQL
AS $$
DELETE FROM audit.graphql_audit WHERE request_time < NOW() - INTERVAL '30 days';
$$;
