GRANT SELECT ON TABLE unit                                              TO csw_exp_messenger_user;
GRANT SELECT ON TABLE treatment_block                                   TO csw_exp_messenger_user;
GRANT SELECT ON TABLE location_association                              TO csw_exp_messenger_user;
GRANT SELECT ON TABLE location_associations_to_send_to_csw              TO csw_exp_messenger_user;
GRANT SELECT ON TABLE deleted_location_associations_to_send_to_csw      TO csw_exp_messenger_user;

GRANT DELETE ON TABLE location_associations_to_send_to_csw              TO csw_exp_messenger_user;
GRANT DELETE ON TABLE deleted_location_associations_to_send_to_csw      TO csw_exp_messenger_user;


CREATE TABLE deleted_location_associations_to_send_to_csw (
    id integer not null
);
CREATE OR REPLACE FUNCTION record_deleted_location_association_ids()
   RETURNS TRIGGER
   LANGUAGE PLPGSQL
AS $$
BEGIN
    INSERT INTO deleted_location_associations_to_send_to_csw (id)
    SELECT id
    FROM old_table;
    RETURN NULL;
END;
$$;
CREATE TRIGGER location_associations_after_delete
    AFTER DELETE ON location_association
    REFERENCING OLD TABLE AS old_table
    FOR EACH STATEMENT
    EXECUTE FUNCTION record_deleted_location_association_ids();


CREATE TABLE location_associations_to_send_to_csw (
    id integer not null
);
CREATE OR REPLACE FUNCTION record_deleted_unit_location_association_ids()
   RETURNS TRIGGER
   LANGUAGE PLPGSQL
AS $$
BEGIN
    INSERT INTO location_associations_to_send_to_csw (id)
    SELECT la.id
    FROM old_table u
           INNER JOIN treatment_block tb ON u.treatment_block_id = tb.id
        INNER JOIN location_association la ON tb.block_id = la.block_id AND u.location = la.location;
    RETURN NULL;
END;
$$;
CREATE TRIGGER units_after_delete
    AFTER DELETE ON unit
    REFERENCING OLD TABLE AS old_table
    FOR EACH STATEMENT
    EXECUTE FUNCTION record_deleted_unit_location_association_ids();
