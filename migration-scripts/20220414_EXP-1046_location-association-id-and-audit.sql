ALTER TABLE location_association
    DISABLE TRIGGER audit_trigger_row;

ALTER TABLE location_association
    ADD COLUMN id serial,
    ADD COLUMN created_user_id VARCHAR,
    ADD COLUMN created_date timestamp with time zone,
    ADD COLUMN modified_user_id VARCHAR,
    ADD COLUMN modified_date timestamp with time zone;

UPDATE location_association
SET id = nextval(pg_get_serial_sequence('location_association', 'id')),
    created_user_id = 'MIGRATION',
    created_date = CURRENT_TIMESTAMP,
    modified_user_id = 'MIGRATION',
    modified_date = CURRENT_TIMESTAMP;

ALTER TABLE location_association
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN created_user_id SET NOT NULL,
    ALTER COLUMN created_date SET NOT NULL,
    ALTER COLUMN modified_user_id SET NOT NULL,
    ALTER COLUMN modified_date SET NOT NULL,
    ADD CONSTRAINT location_association_pk PRIMARY KEY (id);

ALTER TABLE location_association
    ENABLE TRIGGER audit_trigger_row;
