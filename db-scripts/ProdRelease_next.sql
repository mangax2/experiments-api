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