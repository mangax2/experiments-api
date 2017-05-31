CREATE TABLE public.owner
(
	id serial NOT NULL,
    experiment_id integer NOT NULL,
    user_ids character varying ARRAY,
    created_user_id character varying NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_user_id character varying NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    CONSTRAINT owner_pk PRIMARY KEY (id),
    CONSTRAINT owner_experiment FOREIGN KEY (experiment_id)
        REFERENCES public.experiment (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.owner TO experiments_dev_app_user;
GRANT ALL ON SEQUENCE public.owner_id_seq TO experiments_dev_app_user;
GRANT SELECT ON SEQUENCE public.owner_id_seq TO experiments_ro_user;
GRANT SELECT ON TABLE public.owner TO experiments_ro_user;

INSERT INTO public.owner (experiment_id, user_ids, created_user_id, created_date, modified_user_id, modified_date)
SELECT id, ARRAY(SELECT created_user_id UNION SELECT modified_user_id), created_user_id,  CURRENT_TIMESTAMP, created_user_id, CURRENT_TIMESTAMP
FROM public.experiment;

SELECT audit.audit_table('owner');



CREATE TABLE public.ref_design_spec
(
  id serial,
  name character varying NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_design_spec_pk PRIMARY KEY (id)
)

CREATE TABLE public.design_spec_detail
(
  id serial,
  value character varying NOT NULL,
  ref_design_spec_id integer NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT design_spec_detail_pk PRIMARY KEY (id),
  CONSTRAINT "Design_Spec_Detail_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES public.experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "Design_Spec_Detail_Ref_Design_Spec" FOREIGN KEY (ref_design_spec_id)
      REFERENCES public.ref_design_spec (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT design_spec_detail_ak_1 UNIQUE (ref_design_spec_id, experiment_id)
)


-----------------------Run after the table creation dev---------------------------------
--GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO experiments_dev_app_user;
--GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO experiments_dev_app_user;
--GRANT SELECT ON ALL TABLES IN SCHEMA public TO experiments_ro_user;
----
-----------------------Run after the table creation non prod---------------------------------
--GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO experiments_app_user;
--GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO experiments_app_user;
--GRANT SELECT ON ALL TABLES IN SCHEMA public TO experiments_ro_user;
--
-----------------------Run after the table creation prod---------------------------------
--GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO experiments_secure_app_user;
--GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO experiments_secure_app_user;
--GRANT SELECT ON ALL TABLES IN SCHEMA public TO experiments_secure_ro_user;



INSERT INTO public.ref_design_spec(name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Min Rep', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);

INSERT INTO public.ref_design_spec(name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Rep Range Min', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);

INSERT INTO public.ref_design_spec(name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Rep Range Max', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
