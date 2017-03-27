CREATE TABLE ref_data_source_type
(
  id serial NOT NULL,
  type character varying NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_data_source_type_pk PRIMARY KEY (id),
  CONSTRAINT ref_data_source_type_ak_1 UNIQUE (type)
)

CREATE TABLE ref_data_source
(
  id serial NOT NULL,
  name character varying NOT NULL,
  ref_data_source_type_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_data_source_pk PRIMARY KEY (id),
  CONSTRAINT ref_data_source_ref_data_source_type FOREIGN KEY (ref_data_source_type_id)
      REFERENCES public.ref_data_source_type (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT ref_data_source_ak_1 UNIQUE (name)
)

ALTER TABLE public.factor ADD ref_data_source_id integer
ALTER TABLE public.factor ADD CONSTRAINT factor_data_source_fk FOREIGN KEY (ref_data_source_id) REFERENCES public.ref_data_source(id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION


---------------------Run after the table creation---------------------------------
GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO experiments_secure_app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO experiments_secure_app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO experiments_secure_ro_user;