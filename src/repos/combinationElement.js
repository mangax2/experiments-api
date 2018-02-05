import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()
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

  @setErrorCode('501000')
  find = (id, tx = this.rep) => tx.oneOrNone(`${genericSqlStatement} WHERE ce.id = $1`, id)

  @setErrorCode('502000')
  batchFind = (ids, tx = this.rep) => tx.any(`${genericSqlStatement} WHERE ce.id IN ($1:csv)`, [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('503000')
  findAllByTreatmentId = (treatmentId, tx = this.rep) => tx.any(`${genericSqlStatement} WHERE ce.treatment_id = $1`, treatmentId)

  @setErrorCode('504000')
  findAllByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT ce.* FROM combination_element ce INNER JOIN treatment t ON ce.treatment_id = t.id WHERE t.experiment_id = $1', experimentId)

  @setErrorCode('505000')
  batchFindAllByTreatmentIds = (treatmentIds, tx = this.rep) => {
    if (!treatmentIds || treatmentIds.length === 0) {
      return Promise.resolve([])
    }
    return tx.any(`${genericSqlStatement} WHERE ce.treatment_id IN ($1:csv)`, [treatmentIds]).then((data) => {
      const elements = _.groupBy(data, d => d.treatment_id)
      return _.map(treatmentIds, treatmentId => elements[treatmentId] || [])
    })
  }

  @setErrorCode('506000')
  batchCreate = (combinationElements, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['factor_level_id', 'treatment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'combination_element' },
    )
    const values = combinationElements.map(ce => ({
      factor_level_id: ce.factorLevelId,
      treatment_id: ce.treatmentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('507000')
  batchUpdate = (combinationElements, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'factor_level_id', 'treatment_id', 'modified_user_id', 'modified_date'],
      { table: 'combination_element' },
    )
    const data = combinationElements.map(ce => ({
      id: ce.id,
      factor_level_id:ce.factorLevelId,
      treatment_id: ce.treatmentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('508000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM combination_element WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('509000')
  findByBusinessKey = (keys, tx = this.rep) => tx.oneOrNone('SELECT * FROM combination_element' +
    ' WHERE treatment_id = $1 and factor_level_id = $2', keys)

  @setErrorCode('50A000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      treatment_id: obj.keys[0],
      factor_level_id: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(treatment_id, factor_level_id, id) AS (VALUES ${this.pgp.helpers.values(values, ['treatment_id', 'factor_level_id', 'id'])}) select ce.treatment_id, ce.factor_level_id from public.combination_element ce inner join d on ce.treatment_id = CAST(d.treatment_id as integer) and ce.factor_level_id =  CAST(d.factor_level_id as integer) and (d.id is null or ce.id != CAST(d.id as integer))`
    return tx.any(query)
  }
}

module.exports = (rep, pgp) => new combinationElementRepo(rep, pgp)
