-- View: public.experiment_summary

-- DROP VIEW public.experiment_summary;

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
    utn.name_of_unit_type,
    COALESCE(dv.number_of_dependent_variables, 0::bigint)::integer AS number_of_dependent_variables,
    COALESCE(f.number_of_factors, 0::bigint)::integer AS number_of_independent_variables
   FROM experiment e
     LEFT JOIN treatment_numbers t ON t.experiment_id = e.id
     LEFT JOIN dependent_variable_numbers dv ON dv.experiment_id = e.id
     LEFT JOIN factor_numbers f ON f.experiment_id = e.id
     LEFT JOIN experimental_unit_numbers eu ON eu.experiment_id = e.id
     LEFT JOIN unit_spec_numbers us ON us.experiment_id = e.id
     LEFT JOIN unit_type_name utn ON utn.experiment_id = e.id;

ALTER TABLE public.experiment_summary
  OWNER TO experiments_user_s;
GRANT ALL ON TABLE public.experiment_summary TO experiments_user_s;
GRANT SELECT ON TABLE public.experiment_summary TO experiments_ro_user;
GRANT SELECT ON TABLE public.experiment_summary TO experiments_dev_app_user;
GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE public.experiment_summary TO experiments_app_user;
