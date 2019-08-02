CREATE TABLE block
(
  id serial NOT NULL,
  experiment_id integer NOT NULL,
  name character varying,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT block_experiment FOREIGN KEY (experiment_id)
    REFERENCES experiment (id) MATCH SIMPLE
    ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT block_pk PRIMARY KEY (id),
  CONSTRAINT block_unique UNIQUE (experiment_id, name)
);

CREATE TABLE treatment_block
(
  id serial NOT NULL,
  treatment_id integer NOT NULL,
  block_id integer NOT NULL,
  created_user_id character varying NOT NULL,
  created_date timestamp with time zone NOT NULL,
  modified_user_id character varying NOT NULL,
  modified_date timestamp with time zone NOT NULL,
  CONSTRAINT treatment_block_pk PRIMARY KEY (id),
  CONSTRAINT treatment_block_treatment FOREIGN KEY (treatment_id)
      REFERENCES treatment (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT treatment_block_block FOREIGN KEY (block_id)
      REFERENCES block (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT treatment_block_unique UNIQUE (treatment_id, block_id)
);

INSERT INTO public.block (experiment_id, name, created_user_id, created_date, modified_user_id, modified_date)
  SELECT DISTINCT ON (block, experiment_id)
    experiment_id,
    block AS name,
    'migration' AS created_user_id,
    current_timestamp AS created_date,
    'migration' AS modified_user_id,
    current_timestamp AS modified_date
  FROM public.treatment
  WHERE in_all_blocks = false
  ORDER BY experiment_id ASC, block ASC
ON CONFLICT DO NOTHING;

-- fill treatment_block table for treatments with one or no blocks
INSERT INTO public.treatment_block (treatment_id, block_id, created_user_id, created_date, modified_user_id, modified_date)
  SELECT
    treatment.id AS treatment_id,
    block.id AS block_id,
    'migration' AS created_user_id,
    current_timestamp AS created_date,
    'migration' AS modified_user_id,
    current_timestamp AS modified_date
  FROM public.treatment
    INNER JOIN public.block ON block.experiment_id = treatment.experiment_id
		AND (to_number(block.name, '999999999') = treatment.block OR block.name IS NULL)
  WHERE treatment.in_all_blocks = false
  ORDER BY treatment.id ASC
ON CONFLICT DO NOTHING;

-- fill treatment_block table for treatments in all blocks
INSERT INTO public.treatment_block (treatment_id, block_id, created_user_id, created_date, modified_user_id, modified_date)
  SELECT
    treatment.id AS treatment_id,
    block.id AS block_id,
    'migration' AS created_user_id,
    current_timestamp AS created_date,
    'migration' AS modified_user_id,
    current_timestamp AS modified_date
  FROM public.treatment
    INNER JOIN public.block ON block.experiment_id = treatment.experiment_id
  WHERE treatment.block IS NULL
        AND treatment.in_all_blocks = true
  ORDER BY treatment.id ASC, block.id ASC
ON CONFLICT DO NOTHING;

ALTER TABLE public.location_association ADD COLUMN block_id integer,
  ADD CONSTRAINT location_association_block
FOREIGN KEY (block_id) REFERENCES block (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;

UPDATE public.location_association
SET block_id = block.id
FROM public.block
WHERE location_association.experiment_id = block.experiment_id
      AND (location_association.block = to_number(block.name, '999999999') OR block.name IS NULL);

ALTER TABLE public.unit ADD COLUMN treatment_block_id integer,
  ADD CONSTRAINT unit_treatment_block
FOREIGN KEY (treatment_block_id) REFERENCES treatment_block (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE;

UPDATE public.unit
SET treatment_block_id = treatment_block.id, modified_user_id = 'migration', modified_date = current_timestamp
FROM public.treatment_block
JOIN public.block ON block.id = treatment_block.block_id
WHERE unit.treatment_id = treatment_block.treatment_id
AND (unit.block = to_number(block.name, '999999999') OR block.name IS NULL);

-- update view to not rely on treatment_id in unit table
-- CREATE OR REPLACE VIEW public.experiment_summary AS
--  WITH treatment_numbers AS (
--          SELECT e_1.id AS experiment_id,
--             count(*) AS number_of_treatments
--            FROM experiment e_1
--              JOIN treatment t_1 ON t_1.experiment_id = e_1.id
--           GROUP BY e_1.id
--         ), dependent_variable_numbers AS (
--          SELECT e_1.id AS experiment_id,
--             count(*) AS number_of_dependent_variables
--            FROM experiment e_1
--              JOIN dependent_variable dv_1 ON dv_1.experiment_id = e_1.id
--           GROUP BY e_1.id
--         ), factor_numbers AS (
--          SELECT e_1.id AS experiment_id,
--             count(*) AS number_of_factors
--            FROM experiment e_1
--              JOIN factor f_1 ON f_1.experiment_id = e_1.id
--           GROUP BY e_1.id
--         ), experimental_unit_numbers AS (
--          SELECT e_1.id AS experiment_id,
--             count(*) AS number_of_experimental_units
--            FROM experiment e_1
--              JOIN treatment t_1 ON t_1.experiment_id = e_1.id
--              JOIN treatment_block tb ON tb.treatment_id = t_1.id
--              JOIN unit u ON u.treatment_block_id = tb.id
--           GROUP BY e_1.id
--         ), unit_spec_numbers AS (
--          SELECT e_1.id AS experiment_id,
--             count(*) AS number_of_unit_specs
--            FROM experiment e_1
--              JOIN unit_spec_detail usd ON usd.experiment_id = e_1.id
--           GROUP BY e_1.id
--         ), unit_type_name AS (
--          SELECT DISTINCT e_1.id AS experiment_id,
--             rut.name AS name_of_unit_type
--            FROM experiment e_1
--              JOIN unit_spec_detail usd ON usd.experiment_id = e_1.id
--              JOIN ref_unit_spec rus ON rus.id = usd.ref_unit_spec_id
--              JOIN ref_unit_type rut ON rut.id = rus.ref_unit_type_id
--         ), experiment_status AS (
--          SELECT e_1.id AS experiment_id,
--             c_1.description AS status_comment
--            FROM experiment e_1
--              JOIN comment c_1 ON c_1.experiment_id = e_1.id
--           ORDER BY c_1.id DESC
--          LIMIT 1
--         )
--  SELECT e.id,
--     e.name,
--     (COALESCE(dv.number_of_dependent_variables, 0::bigint) + COALESCE(f.number_of_factors, 0::bigint))::integer AS number_of_variables,
--     COALESCE(t.number_of_treatments, 0::bigint)::integer AS number_of_treatments,
--     COALESCE(eu.number_of_experimental_units, 0::bigint)::integer AS number_of_experimental_units,
--     COALESCE(us.number_of_unit_specs, 0::bigint)::integer AS number_of_unit_specs,
--     utn.name_of_unit_type,
--     COALESCE(dv.number_of_dependent_variables, 0::bigint)::integer AS number_of_dependent_variables,
--     COALESCE(f.number_of_factors, 0::bigint)::integer AS number_of_independent_variables,
--     e.status,
--     es.status_comment
--    FROM experiment e
--      LEFT JOIN treatment_numbers t ON t.experiment_id = e.id
--      LEFT JOIN dependent_variable_numbers dv ON dv.experiment_id = e.id
--      LEFT JOIN factor_numbers f ON f.experiment_id = e.id
--      LEFT JOIN experimental_unit_numbers eu ON eu.experiment_id = e.id
--      LEFT JOIN unit_spec_numbers us ON us.experiment_id = e.id
--      LEFT JOIN unit_type_name utn ON utn.experiment_id = e.id
--      LEFT JOIN experiment_status es ON es.experiment_id = e.id;

-- ALTER TABLE public.unit ALTER COLUMN treatment_block_id SET NOT NULL;
--
-- ALTER TABLE public.treatment DROP COLUMN block;
--
-- ALTER TABLE location_association DROP CONSTRAINT location_association_experiment_id_location_number_block_key;
-- ALTER TABLE location_association ADD CONSTRAINT location_association_experiment_id_location_number_block_id_key UNIQUE (experiment_id, location, block_id);
-- ALTER TABLE public.location_association DROP COLUMN block;
--
-- ALTER TABLE public.unit DROP COLUMN block;

-- Before removing treatment id, must update experiment_summary view
-- ALTER TABLE public.unit DROP CONSTRAINT unit_treatment;
-- ALTER TABLE public.unit DROP COLUMN treatment_id;

