CREATE TABLE public.analysis_model
(
    id integer NOT NULL DEFAULT nextval('analysis_model_id_seq'::regclass),
    experiment_id integer NOT NULL,
    analysis_model_code character varying COLLATE pg_catalog."default" NOT NULL,
    analysis_model_sub_type character varying COLLATE pg_catalog."default",
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