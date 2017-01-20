--Prod DDL: First prod release script.
--Exluded blocking_factor, tag and work_instruction tables which are not needed in prod at present.

-- #1 ref_experiment_design table
CREATE TABLE public.ref_experiment_design
(
  id serial NOT NULL,
  name character varying NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_experiment_design_pk PRIMARY KEY (id),
  CONSTRAINT ref_experiment_design_ak_1 UNIQUE (name)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.ref_experiment_design
  OWNER TO experiments_secure_user;

-- #2 ref_factor_type table
CREATE TABLE public.ref_factor_type
(
  id serial NOT NULL,
  type character varying NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_factor_type_pk PRIMARY KEY (id),
  CONSTRAINT ref_factor_type_ak_1 UNIQUE (type)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.ref_factor_type
  OWNER TO experiments_secure_user;

--#3 ref_randomization_strategy
CREATE TABLE public.ref_randomization_strategy
(
  id serial NOT NULL,
  name character varying,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_randomization_strategy_pk PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.ref_randomization_strategy
  OWNER TO experiments_secure_user;

--#4 experiment table
CREATE TABLE public.experiment
(
  id serial NOT NULL,
  name character varying NOT NULL,
  description character varying,
  ref_experiment_design_id integer,
  status character varying(10) NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT experiment_pk PRIMARY KEY (id),
  CONSTRAINT "Experiment_Ref_Experiment_Design" FOREIGN KEY (ref_experiment_design_id)
      REFERENCES public.ref_experiment_design (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.experiment
  OWNER TO experiments_secure_user;


--#5 treatment
CREATE TABLE public.treatment
(
  id serial NOT NULL,
  is_control boolean NOT NULL,
  treatment_number integer NOT NULL,
  notes character varying,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT treatment_pk PRIMARY KEY (id),
  CONSTRAINT treatment_experiment FOREIGN KEY (experiment_id)
      REFERENCES public.experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT treatment_ak_1 UNIQUE (experiment_id, treatment_number)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.treatment
  OWNER TO experiments_secure_user;


CREATE INDEX treatment_experiment_id
  ON public.treatment
  USING btree
  (experiment_id);


--#6 combination element
CREATE TABLE public.combination_element
(
  id serial NOT NULL,
  name character varying NOT NULL,
  value character varying NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  treatment_id integer NOT NULL,
  CONSTRAINT combination_element_pk PRIMARY KEY (id),
  CONSTRAINT combination_element_treatment FOREIGN KEY (treatment_id)
      REFERENCES public.treatment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT combination_element_ak_1 UNIQUE (name, treatment_id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.combination_element
  OWNER TO experiments_secure_user;


CREATE INDEX combination_element_treatment_id
  ON public.combination_element
  USING btree
  (treatment_id);



--#7 dependent_variable
CREATE TABLE public.dependent_variable
(
  id serial NOT NULL,
  required boolean NOT NULL,
  name character varying NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT dependent_variable_pk PRIMARY KEY (id),
  CONSTRAINT "Dependent_Variable_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES public.experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT dependent_variable_ak_1 UNIQUE (name, experiment_id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.dependent_variable
  OWNER TO experiments_secure_user;



--#8 factor
CREATE TABLE public.factor
(
  id serial NOT NULL,
  name character varying NOT NULL,
  ref_factor_type_id integer NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT factor_pk PRIMARY KEY (id),
  CONSTRAINT "Factor_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES public.experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "Factor_Ref_Factor_Type" FOREIGN KEY (ref_factor_type_id)
      REFERENCES public.ref_factor_type (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT factor_ak_1 UNIQUE (name, experiment_id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.factor
  OWNER TO experiments_secure_user;

--#9 factor_level
CREATE TABLE public.factor_level
(
  id serial NOT NULL,
  value character varying NOT NULL,
  factor_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT factor_level_pk PRIMARY KEY (id),
  CONSTRAINT "Factor_Level_Factor" FOREIGN KEY (factor_id)
      REFERENCES public.factor (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT factor_level_ak_1 UNIQUE (value, factor_id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.factor_level
  OWNER TO experiments_secure_user;


--#10 group
CREATE TABLE public."group"
(
  id serial NOT NULL,
  experiment_id integer NOT NULL,
  parent_id integer,
  ref_randomization_strategy_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT group_pk PRIMARY KEY (id),
  CONSTRAINT group_experiment FOREIGN KEY (experiment_id)
      REFERENCES public.experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT group_group FOREIGN KEY (parent_id)
      REFERENCES public."group" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT group_ref_randomization_strategy_fk FOREIGN KEY (ref_randomization_strategy_id)
      REFERENCES public.ref_randomization_strategy (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public."group"
  OWNER TO experiments_secure_user;


--#11 group_value
CREATE TABLE public.group_value
(
  id serial NOT NULL,
  factor_name character varying,
  factor_level character varying,
  group_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  rep_number integer,
  CONSTRAINT group_value_pk PRIMARY KEY (id),
  CONSTRAINT "Group_Value_Group" FOREIGN KEY (group_id)
      REFERENCES public."group" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT group_value_ak_1 UNIQUE (factor_name, factor_level, group_id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.group_value
  OWNER TO experiments_secure_user;

--#12 Unit
CREATE TABLE public.unit
(
  id serial NOT NULL,
  group_id integer,
  treatment_id integer NOT NULL,
  rep integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT unit_pk PRIMARY KEY (id),
  CONSTRAINT unit_group FOREIGN KEY (group_id)
      REFERENCES public."group" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT unit_treatment FOREIGN KEY (treatment_id)
      REFERENCES public.treatment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.unit
  OWNER TO experiments_secure_user;


INSERT INTO public.ref_randomization_strategy (name, created_user_id, created_date, modified_user_id, modified_date)
  VALUES ('Randomized', 'KMCCL', current_timestamp, 'KMCCL', current_timestamp);
INSERT INTO public.ref_randomization_strategy (name, created_user_id, created_date, modified_user_id, modified_date)
  VALUES ('Custom Randomization', 'KMCCL', current_timestamp, 'KMCCL', current_timestamp);

INSERT INTO public.ref_factor_type (type, created_user_id, created_date, modified_user_id, modified_date)
  VALUES ('Independent', 'KMCCL', current_timestamp, 'KMCCL', current_timestamp);

INSERT INTO public.ref_factor_type (type, created_user_id, created_date, modified_user_id, modified_date)
  VALUES ('Exogenous', 'KMCCL', current_timestamp, 'KMCCL', current_timestamp);




CREATE OR REPLACE VIEW public.experiment_summary AS
 WITH treatment_numbers AS (
         SELECT e_1.id AS experiment_id,
            count(*) AS number_of_treatments
           FROM experiment e_1
             JOIN treatment t_1 ON t_1.experiment_id = e_1.id
          GROUP BY e_1.id
        ), dependent_variable_numbers AS (
         SELECT e_1.id AS experiment_id,
            count(*) AS number_of_dependent_variables
           FROM experiment e_1
             JOIN dependent_variable dv_1 ON dv_1.experiment_id = e_1.id
          GROUP BY e_1.id
        ), factor_numbers AS (
         SELECT e_1.id AS experiment_id,
            count(*) AS number_of_factors
           FROM experiment e_1
             JOIN factor f_1 ON f_1.experiment_id = e_1.id
          GROUP BY e_1.id
        ), experimental_unit_numbers AS (
         SELECT e_1.id AS experiment_id,
            count(*) AS number_of_experimental_units
           FROM experiment e_1
             JOIN treatment t_1 ON t_1.experiment_id = e_1.id
             JOIN unit u ON u.treatment_id = t_1.id
          GROUP BY e_1.id
        )
 SELECT e.id,
    e.name,
    (COALESCE(dv.number_of_dependent_variables, 0::bigint) + COALESCE(f.number_of_factors, 0::bigint))::integer AS number_of_variables,
    COALESCE(t.number_of_treatments, 0::bigint)::integer AS number_of_treatments,
    COALESCE(eu.number_of_experimental_units, 0::bigint)::integer AS number_of_experimental_units
   FROM experiment e
     LEFT JOIN treatment_numbers t ON t.experiment_id = e.id
     LEFT JOIN dependent_variable_numbers dv ON dv.experiment_id = e.id
     LEFT JOIN factor_numbers f ON f.experiment_id = e.id
     LEFT JOIN experimental_unit_numbers eu ON eu.experiment_id = e.id;

ALTER TABLE public.experiment_summary
  OWNER TO experiments_secure_user;
GRANT ALL ON TABLE public.experiment_summary TO experiments_secure_user;
