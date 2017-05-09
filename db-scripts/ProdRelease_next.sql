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