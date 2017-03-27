CREATE TABLE tag
(
  id serial NOT NULL,
  name character varying NOT NULL,
  value character varying NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT tag_pk PRIMARY KEY (id),
  CONSTRAINT tag_experiment FOREIGN KEY (experiment_id)
      REFERENCES public.experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT tag_ak_1 UNIQUE (name, value, experiment_id)
);

------Run after the table Creation-----
CREATE INDEX "tag_fki_experiment_id" ON public.tag(experiment_id);

CREATE INDEX "group_fki_parent_id" ON public.group(parent_id);

--Prod grants
GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO experiments_secure_app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO experiments_secure_app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO experiments_secure_ro_user;



