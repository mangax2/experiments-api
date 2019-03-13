CREATE TABLE public.analysis_model
(
    id serial NOT NULL,
    experiment_id integer NOT NULL,
    analysis_model_type character varying COLLATE pg_catalog."default" NOT NULL,
    analysis_model_sub_type character varying COLLATE pg_catalog."default",
    created_user_id character varying COLLATE pg_catalog."default" NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_user_id character varying COLLATE pg_catalog."default" NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    CONSTRAINT analysis_model_pkey PRIMARY KEY (id),
    CONSTRAINT experiment_uniq_key UNIQUE (experiment_id),
    CONSTRAINT experiment_id FOREIGN KEY (experiment_id)
        REFERENCES public.experiment (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE INDEX analysis_model_experiment_id
 ON public.analysis_model USING btree
  (experiment_id)
  TABLESPACE pg_default;