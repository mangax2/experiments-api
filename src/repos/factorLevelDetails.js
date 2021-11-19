import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5QXXXX
class factorLevelDetailsRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5Q0000')
  repository = () => this.rep

  @setErrorCode('5Q2000')
  batchFind = (ids) => this.rep.any('SELECT * FROM factor_level_details WHERE id IN ($1:csv) ORDER BY id asc', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5Q5000')
  all = () => this.rep.any('SELECT * FROM factor_level_details')

  @setErrorCode('5Q6000')
  batchCreate = (factorLevelDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'id:raw',
        'factor_level_id',
        'factor_properties_for_level_id',
        'order',
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
      order: factorLevelDetail.order,
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

  @setErrorCode('5Q7000')
  batchUpdate = (factorLevelDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        '?id',
        'factor_level_id',
        'factor_properties_for_level_id',
        'order',
        'value_type',
        'text',
        'value',
        'question_code',
        'uom_code',
        'modified_user_id',
        'modified_date:raw'
      ],
      {table: 'factor_level_details'}
    )
    const data = factorLevelDetails.map(factorLevelDetail => ({
      id: factorLevelDetail.id,
      factor_level_id: factorLevelDetail.factorLevelId,
      factor_properties_for_level_id: factorLevelDetail.factorPropertiesforLevelId,
      order: factorLevelDetail.order,
      value_type: factorLevelDetail.valueType,
      text: factorLevelDetail.text,
      value: factorLevelDetail.value,
      question_code: factorLevelDetail.questionCode,
      uom_code: factorLevelDetail.uomCode,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))
    const query = `${this.pgp.helpers.update(data, columnSet)} WHERE v.id = t.id RETURNING *`
    return tx.any(query)
  }

  @setErrorCode('5Q8000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM factor_level_details WHERE id IN ($1:csv) RETURNING id', [ids])
  }
}

module.exports = (rep, pgp) => new factorLevelDetailsRepo(rep, pgp)
