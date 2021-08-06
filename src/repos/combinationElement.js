import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

const columns = 'ce.id, ce.factor_level_id,ce.treatment_id, ce.created_user_id, ce.created_date, ce.modified_user_id, ce.modified_date'
const genericSqlStatement = `SELECT ${columns} FROM combination_element ce`

// Error Codes 50XXXX
class combinationElementRepo {
  constructor(rep, pgp){
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('500000')
  repository = () => this.rep

  @setErrorCode('502000')
  batchFind = (ids) => this.rep.any(`${genericSqlStatement} WHERE ce.id IN ($1:csv)`, [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('503000')
  findAllByTreatmentId = (treatmentId) => this.rep.any(`${genericSqlStatement} WHERE ce.treatment_id = $1`, treatmentId)

  @setErrorCode('504000')
  findAllByExperimentId = (experimentId) => this.rep.any('SELECT ce.* FROM combination_element ce INNER JOIN treatment t ON ce.treatment_id = t.id WHERE t.experiment_id = $1', experimentId)

  @setErrorCode('505000')
  batchFindAllByTreatmentIds = (treatmentIds) => {
    if (!treatmentIds || treatmentIds.length === 0) {
      return Promise.resolve([])
    }
    return this.rep.any(`${genericSqlStatement} WHERE ce.treatment_id IN ($1:csv)`, [treatmentIds]).then((data) => {
      const elements = _.groupBy(data, d => d.treatment_id)
      return _.map(treatmentIds, treatmentId => elements[treatmentId] || [])
    })
  }

  @setErrorCode('506000')
  batchCreate = async (combinationElements, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'id:raw',
        'factor_level_id',
        'treatment_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw',
      ],
      { table: 'temp_insert_combination_element' },
    )
    const values = combinationElements.map(ce => ({
      id: 'nextval(pg_get_serial_sequence(\'combination_element\', \'id\'))::integer',
      factor_level_id: ce.factorLevelId,
      treatment_id: ce.treatmentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query1 = `DROP TABLE IF EXISTS temp_insert_combination_element; CREATE TEMP TABLE temp_insert_combination_element AS TABLE combination_element WITH NO DATA; ${this.pgp.helpers.insert(values, columnSet)};`
    const query2 = "INSERT INTO combination_element SELECT * FROM temp_insert_combination_element RETURNING id"
    await tx.any(query1)
    return tx.any(query2)
  }

  @setErrorCode('507000')
  batchUpdate = async (combinationElements, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        '?id',
        'factor_level_id',
        'treatment_id',
        'modified_user_id',
        'modified_date:raw',
      ],
      { table: 'temp_update_combination_element' },
    )
    const data = combinationElements.map(ce => ({
      id: ce.id,
      factor_level_id:ce.factorLevelId,
      treatment_id: ce.treatmentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query1 = `DROP TABLE IF EXISTS temp_update_combination_element; CREATE TEMP TABLE temp_update_combination_element AS TABLE combination_element WITH NO DATA; ${this.pgp.helpers.insert(data, columnSet)};`
    const query2 = `UPDATE combination_element
    SET factor_level_id = tuce.factor_level_id, treatment_id = tuce.treatment_id, modified_user_id = tuce.modified_user_id, modified_date = tuce.modified_date
    FROM temp_update_combination_element tuce
    WHERE combination_element.id = tuce.id`
    await tx.any(query1)
    return tx.any(query2)
  }

  @setErrorCode('508000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM combination_element WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('509000')
  findByBusinessKey = (keys) => this.rep.oneOrNone('SELECT * FROM combination_element' +
    ' WHERE treatment_id = $1 and factor_level_id = $2', keys)

  @setErrorCode('50A000')
  batchFindByBusinessKey = (batchKeys) => {
    const values = batchKeys.map(obj => ({
      treatment_id: obj.keys[0],
      factor_level_id: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(treatment_id, factor_level_id, id) AS (VALUES ${this.pgp.helpers.values(values, ['treatment_id', 'factor_level_id', 'id'])}) select ce.treatment_id, ce.factor_level_id from public.combination_element ce inner join d on ce.treatment_id = CAST(d.treatment_id as integer) and ce.factor_level_id =  CAST(d.factor_level_id as integer) and (d.id is null or ce.id != CAST(d.id as integer))`
    return this.rep.any(query)
  }

  @setErrorCode('50B000')
  findAllByExperimentIdIncludingControls = (experimentId) => this.rep.any('SELECT ce.id, ce.factor_level_id, t.id AS treatment_id FROM combination_element ce RIGHT OUTER JOIN treatment t ON ce.treatment_id = t.id WHERE t.experiment_id = $1', experimentId)
}

module.exports = (rep, pgp) => new combinationElementRepo(rep, pgp)
