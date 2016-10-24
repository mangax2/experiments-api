
CREATE TABLE ref_experiment_design
(
  id serial NOT NULL,
  name character varying NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_experiment_design_pk PRIMARY KEY (id)
);

CREATE TABLE experiment
(
  id serial NOT NULL,
  name character varying NOT NULL,
  subject_type character varying,
  ref_experiment_design_id integer,
  status character varying(10) NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT experiment_pk PRIMARY KEY (id),
  CONSTRAINT "Experiment_Ref_Experiment_Design" FOREIGN KEY (ref_experiment_design_id)
      REFERENCES ref_experiment_design (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE ref_factor_type
(
  id serial NOT NULL,
  type character varying NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_factor_type_pk PRIMARY KEY (id)
);

CREATE TABLE factor
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
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "Factor_Ref_Factor_Type" FOREIGN KEY (ref_factor_type_id)
      REFERENCES ref_factor_type (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE blocking_factor
(
  id serial NOT NULL,
  randomize boolean NOT NULL,
  blocking_order integer NOT NULL,
  factor_id integer NOT NULL,
  experiment_id integer NOT NULL,
  block_on_treatment boolean NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT blocking_factor_pk PRIMARY KEY (id),
  CONSTRAINT "Blocking_Factor_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "Blocking_Factor_Factor" FOREIGN KEY (factor_id)
      REFERENCES factor (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE control_treatment
(
  id serial NOT NULL,
  notes character varying NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT control_treatment_pk PRIMARY KEY (id),
  CONSTRAINT "Control_Treatment_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE control_treatment_variable
(
  id serial NOT NULL,
  name character varying NOT NULL,
  value character varying NOT NULL,
  control_treatment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT control_treatment_variable_pk PRIMARY KEY (id),
  CONSTRAINT "Control_Treatment_Variable_Control_Treatment" FOREIGN KEY (control_treatment_id)
      REFERENCES control_treatment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE controlled_factor
(
  id serial NOT NULL,
  name character varying NOT NULL,
  value character varying NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT controlled_factor_pk PRIMARY KEY (id),
  CONSTRAINT "Control_Factor_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE dependent_variable
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
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE hypothesis
(
  id serial NOT NULL,
  description character varying,
  is_null boolean NOT NULL DEFAULT false,
  status character varying NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT hypothesis_pk PRIMARY KEY (id),
  CONSTRAINT "Hypotheses_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT hypothesis_ak_1 UNIQUE (description, experiment_id, is_null)
);


CREATE TABLE tag
(
  id serial NOT NULL,
  code character varying NOT NULL,
  description character varying NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT tag_pk PRIMARY KEY (id),
  CONSTRAINT "Tag_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE factor_level
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
      REFERENCES factor (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE work_instruction
(
  id serial NOT NULL,
  instruction character varying NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT work_instruction_pk PRIMARY KEY (id),
  CONSTRAINT "Work_Instruction_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE treatment
(
  id serial NOT NULL,
  is_control boolean NOT NULL,
  alias character varying NOT NULL,
  notes character varying NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT treatment_pk PRIMARY KEY (id),
  CONSTRAINT treatment_experiment FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE combination
(
  id serial NOT NULL,
  is_active boolean NOT NULL,
  treatment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT combination_pk PRIMARY KEY (id),
  CONSTRAINT combination_treatment FOREIGN KEY (treatment_id)
      REFERENCES treatment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE combination_element
(
  id serial NOT NULL,
  name character varying NOT NULL,
  value character varying NOT NULL,
  ref_factor_type_id integer NOT NULL,
  combination_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT combination_element_pk PRIMARY KEY (id),
  CONSTRAINT combination_element_combination FOREIGN KEY (combination_id)
      REFERENCES combination (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT combination_element_ref_factor_type FOREIGN KEY (ref_factor_type_id)
      REFERENCES ref_factor_type (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE "group"
(
  id serial NOT NULL,
  variable_name character varying NOT NULL,
  variable_value character varying NOT NULL,
  experiment_id integer NOT NULL,
  parent_id integer,
  treatment_id integer,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT group_pk PRIMARY KEY (id),
  CONSTRAINT group_experiment FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT group_group FOREIGN KEY (parent_id)
      REFERENCES "group" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT group_treatment FOREIGN KEY (treatment_id)
      REFERENCES treatment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE TABLE unit
(
  id serial NOT NULL,
  group_id integer NOT NULL,
  treatment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT unit_pk PRIMARY KEY (id),
  CONSTRAINT unit_group FOREIGN KEY (group_id)
      REFERENCES "group" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT unit_treatment FOREIGN KEY (treatment_id)
      REFERENCES treatment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
)
