CREATE TABLE public.factor_new
(
  id integer NOT NULL,
  name character varying NOT NULL,
  ref_factor_type_id integer NOT NULL,
  experiment_id integer NOT NULL,
  ref_data_source_id integer,
  tier numeric,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT factor_new_pk PRIMARY KEY (id),
  CONSTRAINT "Factor_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES public.experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "Factor_Ref_Factor_Type" FOREIGN KEY (ref_factor_type_id)
      REFERENCES public.ref_factor_type (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT factor_data_source_fk FOREIGN KEY (ref_data_source_id)
      REFERENCES public.ref_data_source (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT factor_new_ak_1 UNIQUE (name, experiment_id),
  CONSTRAINT factor_tier_check CHECK (tier > 0::numeric)
)


-- Table: public.factor_level

-- DROP TABLE public.factor_level;
CREATE TABLE public.factor_level_new
(
  id integer NOT NULL,
  value  jsonb NOT NULL,
  factor_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT factor_level_new_pk PRIMARY KEY (id),
  CONSTRAINT factor_level_new_factor_id_fkey FOREIGN KEY (factor_id)
      REFERENCES public.factor_new (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT factor_level_new_ak_1 UNIQUE (value, factor_id)
)

-- Table: public.combination_element

-- DROP TABLE public.combination_element;

CREATE TABLE public.combination_element_new
(
  id integer NOT NULL,
  factor_level_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  treatment_id integer NOT NULL,
  CONSTRAINT combination_element_new_pk PRIMARY KEY (id),
  CONSTRAINT combination_element_treatment FOREIGN KEY (treatment_id)
      REFERENCES public.treatment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT combination_element_new_factor_level_id_fkey FOREIGN KEY (factor_level_id)
      REFERENCES public.factor_level_new (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT combination_element_new_ak_1 UNIQUE (factor_level_id, treatment_id)
)


-- Index: public.combination_element_treatment_id

-- DROP INDEX public.combination_element_treatment_id;

CREATE INDEX combination_element_new_treatment_id
  ON public.combination_element_new
  USING btree
  (treatment_id);

-- Table: public.group_value

-- DROP TABLE public.group_value;

CREATE TABLE public.group_value_new
(
  id integer NOT NULL,
  name character varying,
  value character varying,
  factor_level_id integer,
  group_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT group_value_new_pk PRIMARY KEY (id),
  CONSTRAINT "Group_Value_Group" FOREIGN KEY (group_id)
      REFERENCES public."group" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT group_value_new_factor_level_id_fkey FOREIGN KEY (factor_level_id)
      REFERENCES public.factor_level_new (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE
  )


CREATE UNIQUE INDEX name_value_factor_level_id_group_id
  ON public.group_value_new
  USING btree
  (name,value,factor_level_id,group_id)

-- Index: public.group_value_group_id

-- DROP INDEX public.group_value_group_id;

CREATE INDEX group_value_new_group_id
  ON public.group_value_new
  USING btree
  (group_id);


