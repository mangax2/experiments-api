ALTER TABLE public.factor
   ADD tier numeric CHECK(tier > 0);

CREATE TABLE ref_group_type (
  id serial NOT NULL,
  type varchar NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_group_type_pk PRIMARY KEY (id),
  CONSTRAINT ref_group_type_ak_1 UNIQUE(type)
);

ALTER TABLE public.group ADD COLUMN ref_group_type_id integer;

ALTER TABLE public.group ADD CONSTRAINT "Group_Ref_Group_Type"
  FOREIGN KEY (ref_group_type_id) REFERENCES public.ref_group_type (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.group_value RENAME COLUMN factor_name TO name;
ALTER TABLE public.group_value RENAME COLUMN factor_level TO value;
ALTER TABLE public.group_value DROP COLUMN rep_number;

INSERT INTO public.ref_group_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Location', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_group_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Block', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_group_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Rep', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_group_type (type, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Split Plot', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);






CREATE TABLE ref_unit_type
(
  id serial NOT NULL,
  name character varying NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_unit_type_pk PRIMARY KEY (id),
  CONSTRAINT "ref_unit_type_ak_1" UNIQUE (name)
);


CREATE TABLE ref_unit_spec
(
  id serial NOT NULL,
  name character varying NOT NULL,
  uom_type character varying,
  ref_unit_type_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT ref_unit_spec_pk PRIMARY KEY (id),
  CONSTRAINT "Ref_Unit_Spec_Ref_Unit_Type" FOREIGN KEY (ref_unit_type_id)
      REFERENCES ref_unit_type (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "ref_unit_spec_ak_1" UNIQUE  (name, ref_unit_type_id)

);


CREATE TABLE unit_spec_detail
(
  id serial NOT NULL,
  value character varying NOT NULL,
  uom_id integer,
  ref_unit_spec_id integer NOT NULL,
  experiment_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT unit_spec_detail_pk PRIMARY KEY (id),
  CONSTRAINT "Unit_Spec_Detail_Experiment" FOREIGN KEY (experiment_id)
      REFERENCES experiment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "Unit_Spec_Detail_Ref_Unit_Spec" FOREIGN KEY (ref_unit_spec_id)
      REFERENCES ref_unit_spec (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "unit_spec_detail_ak_1"  UNIQUE (ref_unit_spec_id, experiment_id)

);



INSERT INTO public.ref_unit_type (name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Plot', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_type (name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Container', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_type (name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Other', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);




INSERT INTO public.ref_unit_spec (name, uom_type, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Length', 'Length', 1, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, uom_type, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Width', 'Length', 1, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Tolerance %', 1, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Type', 2, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Comment', 3, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Length Tolerance', 1, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Width Tolerance', 1, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Min Length', 1, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Min Width', 1, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO public.ref_unit_spec (name, ref_unit_type_id, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Is Field Length', 1, 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);


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
        ), unit_spec_numbers AS (
         SELECT e_1.id AS experiment_id,
            count(*) AS number_of_unit_specs
           FROM experiment e_1
             JOIN unit_spec_detail usd_1 ON usd_1.experiment_id = e_1.id
          GROUP BY e_1.id
        ), unit_type_name AS (
         SELECT DISTINCT e_1.id AS experiment_id,
            rut_1.name AS name_of_unit_type
           FROM experiment e_1
             JOIN unit_spec_detail usd_1 ON usd_1.experiment_id = e_1.id
             JOIN ref_unit_spec rus_1 ON rus_1.id = usd_1.ref_unit_spec_id
             JOIN ref_unit_type rut_1 ON rut_1.id = rus_1.ref_unit_type_id
        )
 SELECT e.id,
    e.name,
    (COALESCE(dv.number_of_dependent_variables, 0::bigint) + COALESCE(f.number_of_factors, 0::bigint))::integer AS number_of_variables,
    COALESCE(t.number_of_treatments, 0::bigint)::integer AS number_of_treatments,
    COALESCE(eu.number_of_experimental_units, 0::bigint)::integer AS number_of_experimental_units,
    COALESCE(us.number_of_unit_specs, 0::bigint)::integer AS number_of_unit_specs,
    utn.name_of_unit_type
   FROM experiment e
     LEFT JOIN treatment_numbers t ON t.experiment_id = e.id
     LEFT JOIN dependent_variable_numbers dv ON dv.experiment_id = e.id
     LEFT JOIN factor_numbers f ON f.experiment_id = e.id
     LEFT JOIN experimental_unit_numbers eu ON eu.experiment_id = e.id
     LEFT JOIN unit_spec_numbers us ON us.experiment_id = e.id
     LEFT JOIN unit_type_name utn ON utn.experiment_id = e.id;


CREATE INDEX "group_experiment_id" ON public.unit(experiment_id);
CREATE INDEX "unit_group_id" ON public.unit(group_id);


