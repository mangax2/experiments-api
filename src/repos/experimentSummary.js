const { setErrorCode } = require('@monsantoit/error-decorator')()

const experimentSummaryQuery = `WITH treatment_numbers AS (
  SELECT e_1.id AS experiment_id,
    count(*) AS number_of_treatments
  FROM experiment e_1
    JOIN treatment t_1 ON t_1.experiment_id = e_1.id
  WHERE e_1.id = $1
  GROUP BY e_1.id
), block_numbers AS (
  SELECT e_1.id AS experiment_id,
    count(*) AS number_of_blocks
  FROM experiment e_1
      JOIN block b_1 ON b_1.experiment_id = e_1.id
  WHERE e_1.id = $1
    GROUP BY e_1.id
), dependent_variable_numbers AS (
  SELECT e_1.id AS experiment_id,
    count(*) AS number_of_dependent_variables
  FROM experiment e_1
      JOIN dependent_variable dv_1 ON dv_1.experiment_id = e_1.id
  WHERE e_1.id = $1
   GROUP BY e_1.id
), factor_numbers AS (
  SELECT e_1.id AS experiment_id,
     count(*) AS number_of_factors
  FROM experiment e_1
    JOIN factor f_1 ON f_1.experiment_id = e_1.id
  WHERE e_1.id = $1
  GROUP BY e_1.id
), experimental_unit_numbers AS (
  SELECT e_1.id AS experiment_id,
    count(*) AS number_of_experimental_units
  FROM experiment e_1
    JOIN treatment t_1 ON t_1.experiment_id = e_1.id
    JOIN treatment_block tb ON tb.treatment_id = t_1.id
    JOIN unit u ON u.treatment_block_id = tb.id
  WHERE e_1.id = $1
  GROUP BY e_1.id
), unit_spec_numbers AS (
  SELECT e_1.id AS experiment_id,
    count(*) AS number_of_unit_specs
  FROM experiment e_1
    JOIN unit_spec_detail usd ON usd.experiment_id = e_1.id
  WHERE e_1.id = $1
  GROUP BY e_1.id
), unit_type_name AS (
  SELECT DISTINCT e_1.id AS experiment_id,
    rut.name AS name_of_unit_type
  FROM experiment e_1
    JOIN unit_spec_detail usd ON usd.experiment_id = e_1.id
    JOIN ref_unit_spec rus ON rus.id = usd.ref_unit_spec_id
    JOIN ref_unit_type rut ON rut.id = rus.ref_unit_type_id
  WHERE e_1.id = $1
), experiment_status AS (
  SELECT e_1.id AS experiment_id,
    c_1.description AS status_comment
  FROM experiment e_1
    JOIN comment c_1 ON c_1.experiment_id = e_1.id
  WHERE e_1.id = $1
   ORDER BY c_1.id DESC
  LIMIT 1
)
SELECT e.id,
  e.name,
  COALESCE(b.number_of_blocks, 0::bigint)::integer AS number_of_blocks,
  (COALESCE(dv.number_of_dependent_variables, 0::bigint) + COALESCE(f.number_of_factors, 0::bigint))::integer AS number_of_variables,
  COALESCE(t.number_of_treatments, 0::bigint)::integer AS number_of_treatments,
  COALESCE(eu.number_of_experimental_units, 0::bigint)::integer AS number_of_experimental_units,
  COALESCE(us.number_of_unit_specs, 0::bigint)::integer AS number_of_unit_specs,
  utn.name_of_unit_type,
  COALESCE(dv.number_of_dependent_variables, 0::bigint)::integer AS number_of_dependent_variables,
  COALESCE(f.number_of_factors, 0::bigint)::integer AS number_of_independent_variables,
  e.status,
  es.status_comment
FROM experiment e
  LEFT JOIN block_numbers b on b.experiment_id = e.id
  LEFT JOIN treatment_numbers t ON t.experiment_id = e.id
  LEFT JOIN dependent_variable_numbers dv ON dv.experiment_id = e.id
  LEFT JOIN factor_numbers f ON f.experiment_id = e.id
  LEFT JOIN experimental_unit_numbers eu ON eu.experiment_id = e.id
  LEFT JOIN unit_spec_numbers us ON us.experiment_id = e.id
  LEFT JOIN unit_type_name utn ON utn.experiment_id = e.id
  LEFT JOIN experiment_status es ON es.experiment_id = e.id
WHERE e.id = $1;`

// Error Codes 56XXXX
class experimentSummaryRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('560000')
  repository = () => this.rep

  @setErrorCode('561000')
  find = (id, tx = this.rep) => tx.oneOrNone(experimentSummaryQuery, id)

  @setErrorCode('562000')
  all = () => this.rep.any('SELECT * FROM experiment_summary')
}

module.exports = rep => new experimentSummaryRepo(rep)
