ALTER TABLE public.group
	DROP COLUMN ref_randomization_strategy_id;

-- Table: public.comment

-- DROP TABLE public.comment;

CREATE TABLE public.comment
(
    id serial NOT NULL,
    description character varying COLLATE pg_catalog."default" NOT NULL,
    experiment_id integer NOT NULL,
    created_user_id character varying COLLATE pg_catalog."default" NOT NULL,
    created_date timestamp with time zone NOT NULL,
    modified_user_id character varying COLLATE pg_catalog."default" NOT NULL,
    modified_date timestamp with time zone NOT NULL,
    CONSTRAINT comments_pk PRIMARY KEY (id),
    CONSTRAINT "Comments_Experiment" FOREIGN KEY (experiment_id)
        REFERENCES public.experiment (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.comment
    OWNER to experiments_secure_user;

GRANT INSERT, DELETE, UPDATE, SELECT ON TABLE public.comment TO experiments_secure_app_user;

GRANT SELECT ON TABLE public.comment TO experiments_secure_ro_user;

GRANT ALL ON TABLE public.comment TO experiments_secure_user;

GRANT SELECT, USAGE ON SEQUENCE public.comment_id_seq TO experiments_secure_app_user;
