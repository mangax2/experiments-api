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
);

INSERT INTO public.ref_data_source_type(
             type, created_user_id, created_date, modified_user_id, modified_date)
    VALUES ( 'Catalog', 'KPRAT1', CURRENT_TIMESTAMP, 'KPRAT1', CURRENT_TIMESTAMP);
    INSERT INTO public.ref_data_source_type(
             type, created_user_id, created_date, modified_user_id, modified_date)
    VALUES ( 'I do not have a data source', 'KPRAT1', CURRENT_TIMESTAMP, 'KPRAT1', CURRENT_TIMESTAMP);

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
);
-----Update FK based on Primary Key------------------
INSERT INTO public.ref_data_source(
            name, ref_data_source_type_id, created_user_id, created_date,
            modified_user_id, modified_date)
    VALUES ( 'Formulation Catalog', 1, 'KPRAT1', CURRENT_TIMESTAMP,
            'KPRAT1', CURRENT_TIMESTAMP);

 INSERT INTO public.ref_data_source(
            name, ref_data_source_type_id, created_user_id, created_date,
            modified_user_id, modified_date)
    VALUES ( 'Other', 2, 'KPRAT1', CURRENT_TIMESTAMP,
            'KPRAT1', CURRENT_TIMESTAMP);


ALTER TABLE public.factor ADD ref_data_source_id integer;
ALTER TABLE public.factor ADD CONSTRAINT factor_data_source_fk FOREIGN KEY (ref_data_source_id) REFERENCES public.ref_data_source(id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.dependent_variable ADD question_code varchar NULL;
COMMENT ON COLUMN dependent_variable.question_code IS 'Referencing Question Code from Q&A';



------------------
UPDATE public.ref_unit_spec
SET name='Description'
WHERE ref_unit_type_id = 2 AND name = 'Type'
	OR ref_unit_type_id = 3 AND name = 'Comment';


------------------
ALTER TABLE public.group
  DROP CONSTRAINT group_ref_randomization_strategy_fk,
  ALTER COLUMN ref_randomization_strategy_id DROP NOT NULL;

DROP TABLE public.ref_randomization_strategy;

ALTER TABLE public.tag
  DROP CONSTRAINT tag_experiment,
  ADD CONSTRAINT tag_experiment FOREIGN KEY (experiment_id)
    REFERENCES public.experiment (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

UPDATE public.group
SET ref_randomization_strategy_id = 1;



---------------------Run after the table creation dev---------------------------------
GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO experiments_dev_app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO experiments_dev_app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO experiments_ro_user;

---------------------Run after the table creation non prod---------------------------------
GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO experiments_app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO experiments_app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO experiments_ro_user;

---------------------Run after the table creation prod---------------------------------
GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO experiments_secure_app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO experiments_secure_app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO experiments_secure_ro_user;

