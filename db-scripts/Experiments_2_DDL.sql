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


