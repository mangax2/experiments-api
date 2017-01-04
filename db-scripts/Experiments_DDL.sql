
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
      ON UPDATE NO ACTION ON DELETE CASCADE
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
  rep integer NOT NULL,
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
);

ALTER TABLE public.hypothesis DROP CONSTRAINT "Hypotheses_Experiment";
ALTER TABLE public.hypothesis
ADD CONSTRAINT "Hypotheses_Experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.factor DROP CONSTRAINT "Factor_Experiment";
ALTER TABLE public.factor
ADD CONSTRAINT "Factor_Experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.dependent_variable DROP CONSTRAINT "Dependent_Variable_Experiment";
ALTER TABLE public.dependent_variable
ADD CONSTRAINT "Dependent_Variable_Experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;


ALTER TABLE public.blocking_factor DROP CONSTRAINT "Blocking_Factor_Experiment";
ALTER TABLE public.blocking_factor
ADD CONSTRAINT "Blocking_Factor_Experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;


ALTER TABLE public.controlled_factor DROP CONSTRAINT "Control_Factor_Experiment";
ALTER TABLE public.controlled_factor
ADD CONSTRAINT "Control_Factor_Experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;


ALTER TABLE public.group DROP CONSTRAINT "group_experiment";
ALTER TABLE public.group
ADD CONSTRAINT "group_experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;


ALTER TABLE public.tag DROP CONSTRAINT "Tag_Experiment";
ALTER TABLE public.tag
ADD CONSTRAINT "Tag_Experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;


ALTER TABLE public.treatment DROP CONSTRAINT "treatment_experiment";
ALTER TABLE public.treatment
ADD CONSTRAINT "treatment_experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;


ALTER TABLE public.work_instruction DROP CONSTRAINT "Work_Instruction_Experiment";
ALTER TABLE public.work_instruction
ADD CONSTRAINT "Work_Instruction_Experiment"
FOREIGN KEY (experiment_id) REFERENCES experiment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;


ALTER TABLE public.combination_element DROP CONSTRAINT "combination_element_combination";
ALTER TABLE public.combination_element DROP COLUMN "combination_id";
ALTER TABLE public.combination_element ADD COLUMN treatment_id integer NOT NULL;
ALTER TABLE public.combination_element
ADD CONSTRAINT "combination_element_treatment"
FOREIGN KEY (treatment_id) REFERENCES treatment (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;
DROP TABLE public.combination;

ALTER TABLE public.treatment RENAME COLUMN alias TO name;
ALTER TABLE public.treatment ALTER COLUMN notes DROP NOT NULL;

ALTER TABLE public.combination_element DROP CONSTRAINT "combination_element_ref_factor_type";
ALTER TABLE public.combination_element DROP COLUMN "ref_factor_type_id";


ALTER TABLE public.blocking_factor ADD CONSTRAINT "blocking_factor_ak_1" UNIQUE(factor_id, experiment_id);
ALTER TABLE public.combination_element ADD CONSTRAINT "combination_element_ak_1" UNIQUE(name, treatment_id);
ALTER TABLE public.dependent_variable ADD CONSTRAINT "dependent_variable_ak_1" UNIQUE(name, experiment_id);
ALTER TABLE public.factor ADD CONSTRAINT "factor_ak_1" UNIQUE(name, experiment_id);
ALTER TABLE public.factor_level ADD CONSTRAINT "factor_level_ak_1" UNIQUE(value, factor_id);
ALTER TABLE public.group ADD CONSTRAINT "group_ak_1" UNIQUE(variable_name, variable_value, experiment_id);
ALTER TABLE public.ref_experiment_design ADD CONSTRAINT "ref_experiment_design_ak_1" UNIQUE(name);
ALTER TABLE public.ref_factor_type ADD CONSTRAINT "ref_factor_type_ak_1" UNIQUE(type);
ALTER TABLE public.tag ADD CONSTRAINT "tag_ak_1" UNIQUE(code, experiment_id);
ALTER TABLE public.treatment ADD CONSTRAINT "treatment_ak_1" UNIQUE(name, experiment_id);
ALTER TABLE public.work_instruction ADD CONSTRAINT "work_instruction_ak_1" UNIQUE(instruction, experiment_id);
-- ALTER TABLE public.unit ADD CONSTRAINT "unit_ak_1" UNIQUE(treatment_id, rep);

ALTER TABLE public.group DROP CONSTRAINT "group_ak_1";
ALTER TABLE public.group ADD CONSTRAINT "group_ak_1" UNIQUE(variable_name, variable_value, experiment_id, parent_id);

ALTER TABLE public.group DROP CONSTRAINT "group_group";
ALTER TABLE public.group
ADD CONSTRAINT "group_group"
FOREIGN KEY (parent_id) REFERENCES public.group(id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.unit DROP CONSTRAINT "unit_group";
ALTER TABLE public.unit
ADD CONSTRAINT "unit_group"
FOREIGN KEY (group_id) REFERENCES public.group(id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.unit DROP CONSTRAINT "unit_treatment";
ALTER TABLE public.unit
ADD CONSTRAINT "unit_treatment"
FOREIGN KEY (treatment_id) REFERENCES public.treatment(id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.unit ALTER COLUMN group_id DROP NOT NULL;


CREATE INDEX "treatment_experiment_id" ON public.treatment(experiment_id);
CREATE INDEX "combination_element_treatment_id" ON public.combination_element(treatment_id);

-- Treatment Table: Change name to treatment_number
ALTER TABLE Treatment DROP CONSTRAINT "treatment_ak_1";
ALTER TABLE Treatment RENAME COLUMN name To treatment_number;
ALTER TABLE Treatment ALTER COLUMN treatment_number DROP NOT NULL;
UPDATE Treatment SET treatment_number = null;
ALTER TABLE Treatment ALTER COLUMN treatment_number TYPE integer USING (treatment_number::integer);
WITH updateTable as (SELECT id, experiment_id, rank() OVER (PARTITION BY experiment_id ORDER BY id ASC) as treatment_number FROM Treatment)
UPDATE Treatment SET treatment_number = updateTable.treatment_number FROM updateTable WHERE Treatment.id = updateTable.id;
ALTER TABLE Treatment ALTER COLUMN treatment_number SET NOT NULL;
ALTER TABLE Treatment ADD CONSTRAINT "treatment_ak_1" UNIQUE(experiment_id, treatment_number);

--Group table changes

ALTER TABLE "group" DROP CONSTRAINT "group_treatment";
ALTER TABLE "group" RENAME COLUMN treatment_id To randomize;
UPDATE "group"  SET randomize = null;
ALTER TABLE "group" ALTER COLUMN randomize TYPE boolean using randomize::boolean;
UPDATE "group" SET randomize = false;
ALTER TABLE "group" ALTER COLUMN randomize SET NOT NULL;
ALTER TABLE "group" DROP CONSTRAINT "group_ak_1";
ALTER TABLE "group" DROP COLUMN "variable_name";
ALTER TABLE "group" DROP COLUMN "variable_value";


--group_value table
CREATE TABLE group_value
(
  id serial NOT NULL,
  factor_name character varying NOT NULL,
  factor_level character varying NOT NULL,
  group_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT group_value_pk PRIMARY KEY (id),
  CONSTRAINT "Group_Value_Group" FOREIGN KEY (group_id)
      REFERENCES "group" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT group_value_ak_1 UNIQUE (factor_name, factor_level, group_id)
)



-- Drop Hypothesis Table
--Alter Subject Type Column to Descriptiuon in Experiment Table
ALTER TABLE IF EXISTS ONLY experiment
RENAME COLUMN subject_type to description

DROP TABLE IF EXISTS  hypothesis CASCADE


-- Create experiment_summary view
CREATE VIEW experiment_summary AS
WITH treatment_numbers AS (
  SELECT e.id AS experiment_id, COUNT(*) AS number_of_treatments
	FROM public.experiment e
    INNER JOIN public.treatment t ON t.experiment_id = e.id
  GROUP BY e.id),
dependent_variable_numbers AS (
  SELECT e.id AS experiment_id, COUNT(*) AS number_of_dependent_variables
	FROM public.experiment e
  	INNER JOIN public.dependent_variable dv ON dv.experiment_id = e.id
  GROUP BY e.id),
factor_numbers AS (
  SELECT e.id AS experiment_id, COUNT(*) AS number_of_factors
	FROM public.experiment e
  	INNER JOIN public.factor f ON f.experiment_id = e.id
  GROUP BY e.id),
experimental_unit_numbers AS (
  SELECT e.id AS experiment_id, COUNT(*) AS number_of_experimental_units
	FROM public.experiment e
    INNER JOIN public.treatment t ON t.experiment_id = e.id
    INNER JOIN public.unit u ON u.treatment_id = t.id
  GROUP BY e.id)

SELECT e.id,
	e.name,
	CAST(COALESCE(dv.number_of_dependent_variables, 0) + COALESCE(f.number_of_factors, 0) AS int) AS number_of_variables,
    CAST(COALESCE(t.number_of_treatments, 0) AS int) AS number_of_treatments,
    CAST(COALESCE(eu.number_of_experimental_units, 0) AS int) AS number_of_experimental_units
FROM public.experiment e
	LEFT OUTER JOIN treatment_numbers t ON t.experiment_id = e.id
	LEFT OUTER JOIN dependent_variable_numbers dv ON dv.experiment_id = e.id
	LEFT OUTER JOIN factor_numbers f ON f.experiment_id = e.id
	LEFT OUTER JOIN experimental_unit_numbers eu ON eu.experiment_id = e.id