ALTER TABLE public.group ADD set_id INTEGER;

INSERT INTO ref_design_spec (name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Rep Dimension X', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);
INSERT INTO ref_design_spec (name, created_user_id, created_date, modified_user_id, modified_date) VALUES ('Rep Dimension Y', 'KMCCL', CURRENT_TIMESTAMP, 'KMCCL', CURRENT_TIMESTAMP);

create or replace function getNoDataSourceId() returns integer as
$$
declare x integer;
begin
  select id from ref_data_source_type where type = 'I do not have a data source' into x;
  return x;
end;
$$ LANGUAGE plpgsql;

insert into ref_data_source(name, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Custom', getNoDataSourceId(), 'PNWATT', CURRENT_TIMESTAMP, 'PNWATT', CURRENT_TIMESTAMP);

insert into ref_data_source(name, ref_data_source_type_id, created_user_id, created_date, modified_user_id, modified_date)
values('Composite', getNoDataSourceId(), 'PNWATT', CURRENT_TIMESTAMP, 'PNWATT', CURRENT_TIMESTAMP);

drop function getNoDataSourceId();


CREATE INDEX factor_level_new_factor_id
  ON public.factor_level_new
  USING btree
  (factor_id);

CREATE INDEX combination_element_new_factor_level_id
  ON public.combination_element_new
  USING btree
  (factor_level_id);

CREATE INDEX group_value_new_factor_level_id
  ON public.group_value_new
  USING btree
  (factor_level_id);

CREATE INDEX unit_treatment_id
  ON public.unit
  USING btree
  (treatment_id);

UPDATE ref_data_source SET name='None' WHERE name='Other';

-- ******************************* The above statements have been run in NP **********************************
ALTER SEQUENCE factor_level_id_seq
	OWNED BY public.factor_level.id;
ALTER SEQUENCE factor_id_seq
	OWNED BY public.factor.id;
ALTER SEQUENCE combination_element_id_seq
	OWNED BY public.combination_element.id;
ALTER SEQUENCE group_value_id_seq
	OWNED BY public.group_value.id;

ALTER TABLE public.factor_level_new
  ALTER COLUMN id SET DEFAULT nextval('factor_level_id_seq'::regclass);
ALTER TABLE public.factor_new
  ALTER COLUMN id SET DEFAULT nextval('factor_id_seq'::regclass);
ALTER TABLE public.combination_element_new
  ALTER COLUMN id SET DEFAULT nextval('combination_element_id_seq'::regclass);
ALTER TABLE public.group_value_new
  ALTER COLUMN id SET DEFAULT nextval('group_value_id_seq'::regclass);

DROP TABLE public.group_value;
DROP TABLE public.combination_element;
DROP TABLE public.factor_level;
DROP TABLE public.factor;

ALTER TABLE public.factor_new RENAME TO factor;
ALTER TABLE public.factor_level_new RENAME TO factor_level;
ALTER TABLE public.combination_element_new RENAME TO combination_element;
ALTER TABLE public.group_value_new RENAME TO group_value;

-- Alter view to use factor instead of factor_new
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
             JOIN unit_spec_detail usd ON usd.experiment_id = e_1.id
          GROUP BY e_1.id
        ), unit_type_name AS (
         SELECT DISTINCT e_1.id AS experiment_id,
            rut.name AS name_of_unit_type
           FROM experiment e_1
             JOIN unit_spec_detail usd ON usd.experiment_id = e_1.id
             JOIN ref_unit_spec rus ON rus.id = usd.ref_unit_spec_id
             JOIN ref_unit_type rut ON rut.id = rus.ref_unit_type_id
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

ALTER TABLE public.experiment_summary
    OWNER TO experiments_user_s;

GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.experiment_summary TO experiments_app_user;
GRANT SELECT ON TABLE public.experiment_summary TO experiments_ro_user;
GRANT ALL ON TABLE public.experiment_summary TO experiments_user_s;
GRANT SELECT ON TABLE public.experiment_summary TO experiments_dev_app_user;