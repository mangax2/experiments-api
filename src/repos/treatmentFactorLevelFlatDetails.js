const { setErrorCode } = require('@monsantoit/error-decorator')()

const query = `
WITH temp_generate_json AS (
	SELECT
		fld.factor_level_id,
		fld.row_number,
		json_build_object('questionCode',
			CASE WHEN fpl.multi_question_tag IS NOT NULL THEN
				fld.question_code
			ELSE
				fpl.question_code
			END,
			'rowNumber',
			row_number,
			'objectType',
			object_type,
			'label',
			label,
			'multiQuestionTag',
			multi_question_tag,
			'catalogType',
			catalog_type,
			'valueType',
			value_type,
			'text',
			text,
			'value',
			value,
			'uomCode',
			uom_code) AS json_out
	FROM
		factor_properties_for_level fpl
		JOIN factor_level_details fld ON fld.factor_properties_for_level_id = fpl.id
	WHERE
		fld.factor_level_id in ($1:csv)
	ORDER BY
		fld.factor_level_id,
		fld.row_number,
		fpl.column_number
),
final_group AS (
	SELECT
		factor_level_id,
		json_agg(json_out) AS agg_array
	FROM
		temp_generate_json
	GROUP BY
		factor_level_id
)
SELECT
	json_object_agg(factor_level_id, agg_array) AS level_details
FROM
	final_group
`

// Error Codes 5YXXXX
class treatmentVariableLevelFlatDetailsRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5Y2000')
  batchFind = async (ids) => {
    const [{ level_details: levelDetails }] = await this.rep.any(query, [ids])
    return ids.map(id => levelDetails[id])
  }
}

module.exports = (rep, pgp) => new treatmentVariableLevelFlatDetailsRepo(rep, pgp)
