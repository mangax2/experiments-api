import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()
const columns = "id,value,factor_id,created_user_id,created_date,modified_user_id,modified_date"
const qualifiedColumns = "fl.id,fl.value,fl.factor_id,fl.created_user_id,fl.created_date,fl.modified_user_id,fl.modified_date"


// Error Codes 58XXXX
class factorLevelRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('580000')
  repository = () => this.rep

  @setErrorCode('581000')
  find = (id, tx = this.rep) => tx.oneOrNone(`SELECT ${columns} FROM factor_level WHERE id = $1`, id)

  @setErrorCode('582000')
  batchFind = (ids, tx = this.rep) => tx.any(`SELECT ${columns} FROM factor_level WHERE id IN ($1:csv) ORDER BY id asc`, [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('583000')
  findByExperimentId = (experimentId, tx = this.rep) =>
    tx.any(`SELECT ${qualifiedColumns} FROM factor f inner join factor_level fl on f.id = fl.factor_id WHERE experiment_id=$1  ORDER BY  fl.id asc`, experimentId)

  @setErrorCode('584000')
  findByFactorId = factorId => this.rep.any(`SELECT ${columns} FROM factor_level WHERE factor_id = $1`, factorId)

  @setErrorCode('585000')
  all = () => this.rep.any('SELECT ${columns} FROM factor_level')

  @setErrorCode('586000')
  batchCreate = (factorLevels, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'value:raw',
        'factor_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw'
      ],
      {table: 'factor_level'})
    const values = factorLevels.map(factorLevel => ({
      value: `CAST(${this.pgp.as.json(factorLevel.value)} AS jsonb)`,
      factor_id: factorLevel.factorId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet)} RETURNING id`
    return tx.any(query)
  }

  @setErrorCode('587000')
  batchUpdate = (factorLevels, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        '?id',
        'value:raw',
        'factor_id',
        'modified_user_id',
        'modified_date:raw'
      ],
      {table: 'factor_level'}
    )
    const data = factorLevels.map(factorLevel => ({
      id: factorLevel.id,
      value: `CAST(${this.pgp.as.json(factorLevel.value)} AS jsonb)`,
      factor_id: factorLevel.factorId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))
    const query = `${this.pgp.helpers.update(data, columnSet)} WHERE v.id = t.id RETURNING *`
    return tx.any(query)
  }

  @setErrorCode('588000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM factor_level WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('589000')
  findByBusinessKey = (keys, tx) => tx.oneOrNone(`SELECT ${columns} FROM factor_level WHERE factor_id = $1 and value = $2`, keys)

  @setErrorCode('58A000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      factor_id: obj.keys[0],
      value: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(factor_id, value, id) AS (VALUES ${this.pgp.helpers.values(values, ['factor_id', 'value', 'id'])}) select entity.factor_id, entity.value from public.factor_level entity inner join d on entity.factor_id = CAST(d.factor_id as integer) and entity.value = CAST(d.value as jsonb) and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  }

  @setErrorCode('58B000')
  batchFindByFactorId = (factorIds, tx = this.rep) => {
    return tx.any(`SELECT ${columns} FROM factor_level WHERE factor_id in ($1:csv)`, [factorIds])
      .then(data => _.map(factorIds, factorId => _.filter(data, row => row.factor_id === factorId)))
  }
}

module.exports = (rep, pgp) => new factorLevelRepo(rep, pgp)
