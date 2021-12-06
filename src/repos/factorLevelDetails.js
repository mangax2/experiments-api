import keyBy from 'lodash/keyBy'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5QXXXX
class factorLevelDetailsRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }
  
  @setErrorCode('5Q6000')
  batchCreate = (factorLevelDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'id:raw',
        'factor_level_id',
        'factor_properties_for_level_id',
        'row_number',
        'value_type',
        'text',
        'value',
        'question_code',
        'uom_code',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw'
      ],
      {table: 'temp_insert_factor_level_details'})
    const values = factorLevelDetails.map(factorLevelDetail => ({
      id: 'nextval(pg_get_serial_sequence(\'factor_level_details\', \'id\'))::integer',
      factor_level_id: factorLevelDetail.factorLevelId,
      factor_properties_for_level_id: factorLevelDetail.factorPropertiesForLevelId,
      row_number: factorLevelDetail.rowNumber,
      value_type: factorLevelDetail.valueType,
      text: factorLevelDetail.text,
      value: factorLevelDetail.value,
      question_code: factorLevelDetail.questionCode,
      uom_code: factorLevelDetail.uomCode,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))

    // Split into two queries to drastically reduce the time it takes to audit the inserts for
    // large number of rows. This is likely due to the size of the query being writtent to the audit.logged_actions table.
    const query1 = `DROP TABLE IF EXISTS temp_insert_factor_level_details; CREATE TEMP TABLE temp_insert_factor_level_details AS TABLE factor_level_details WITH NO DATA; ${this.pgp.helpers.insert(values, columnSet)};`
    const query2 = "INSERT INTO factor_level_details SELECT * FROM temp_insert_factor_level_details RETURNING id"
    return tx.query(query1)
      .then(() => tx.any(query2))
  }
}

module.exports = (rep, pgp) => new factorLevelDetailsRepo(rep, pgp)
