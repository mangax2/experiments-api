import keyBy from 'lodash/keyBy'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5WXXXX
class factorPropertiesForLevelRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5W6000')
  batchCreate = (factorPropertiesForLevels, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'id:raw',
        'factor_id',
        'column_number',
        'object_type',
        'label',
        'question_code',
        'multi_question_tag',
        'catalog_type',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw'
      ],
      {table: 'temp_insert_factor_properties_for_level'})
    const values = factorPropertiesForLevels.map(factorPropertiesForLevel => ({
      id: 'nextval(pg_get_serial_sequence(\'factor_properties_for_level\', \'id\'))::integer',
      factor_id: factorPropertiesForLevel.factorId,
      column_number: factorPropertiesForLevel.columnNumber,
      object_type: factorPropertiesForLevel.objectType,
      label: factorPropertiesForLevel.label,
      question_code: factorPropertiesForLevel.questionCode,
      multi_question_tag: factorPropertiesForLevel.multiQuestionTag,
      catalog_type: factorPropertiesForLevel.catalogType,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))

    // Split into two queries to drastically reduce the time it takes to audit the inserts for
    // large number of rows. This is likely due to the size of the query being writtent to the audit.logged_actions table.
    const query1 = `DROP TABLE IF EXISTS temp_insert_factor_properties_for_level; CREATE TEMP TABLE temp_insert_factor_properties_for_level AS TABLE factor_properties_for_level WITH NO DATA; ${this.pgp.helpers.insert(values, columnSet)};`
    const query2 = "INSERT INTO factor_properties_for_level SELECT * FROM temp_insert_factor_properties_for_level RETURNING id"
    return tx.query(query1)
      .then(() => tx.any(query2))
  }

  @setErrorCode('5W8000')
  batchRemoveByExperimentId = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM factor_properties_for_level WHERE factor_id IN (SELECT id FROM factor WHERE experiment_id IN ($1:csv)) RETURNING id', [ids])
  }
}

module.exports = (rep, pgp) => new factorPropertiesForLevelRepo(rep, pgp)
