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
  CONSTRAINT tag_ak_1 UNIQUE (name, value, experiment_id)
)