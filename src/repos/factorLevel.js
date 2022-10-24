import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

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

  @setErrorCode('582000')
  batchFind = (ids, tx = this.rep) => tx.any(`SELECT ${columns} FROM factor_level WHERE id IN ($1:csv) ORDER BY id asc`, [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('583000')
  findByExperimentId = (experimentId) =>
  this.rep.any(`SELECT ${qualifiedColumns} FROM factor f inner join factor_level fl on f.id = fl.factor_id WHERE experiment_id=$1  ORDER BY  fl.id asc`, experimentId)

  @setErrorCode('585000')
  all = () => this.rep.any(`SELECT ${columns} FROM factor_level`)

  @setErrorCode('586000')
  batchCreate = (factorLevels, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'id:raw',
        'value',
        'factor_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw'
      ],
      {table: 'temp_insert_factor_level'})
    const values = factorLevels.map(factorLevel => ({
      id: 'nextval(pg_get_serial_sequence(\'factor_level\', \'id\'))::integer',
      value: factorLevel.value,
      factor_id: factorLevel.treatmentVariableLevelId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))
    // Split into two queries to drastically reduce the time it takes to audit the inserts for
    // large number of rows. This is likely due to the size of the query being writtent to the audit.logged_actions table.
    const query1 = `DROP TABLE IF EXISTS temp_insert_factor_level; CREATE TEMP TABLE temp_insert_factor_level AS TABLE factor_level WITH NO DATA; ${this.pgp.helpers.insert(values, columnSet)};`
    const query2 = "INSERT INTO factor_level SELECT * FROM temp_insert_factor_level RETURNING id"
    return tx.query(query1)
      .then(() => tx.any(query2))
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
      factor_id: factorLevel.treatmentVariableLevelId,
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
  findByBusinessKey = (keys) => this.rep.oneOrNone(`SELECT ${columns} FROM factor_level WHERE factor_id = $1 and value = $2`, keys)

  @setErrorCode('58A000')
  batchFindByBusinessKey = (batchKeys) => {
    const values = batchKeys.map(obj => ({
      factor_id: obj.keys[0],
      value: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(factor_id, value, id) AS (VALUES ${this.pgp.helpers.values(values, ['factor_id', 'value', 'id'])}) select entity.factor_id, entity.value from public.factor_level entity inner join d on entity.factor_id = CAST(d.factor_id as integer) and entity.value = CAST(d.value as jsonb) and (d.id is null or entity.id != CAST(d.id as integer))`
    return this.rep.any(query)
  }

  @setErrorCode('58B000')
  batchFindByFactorId = (factorIds) => {
    return this.rep.any(`SELECT ${columns} FROM factor_level WHERE factor_id in ($1:csv)`, [factorIds])
      .then(data => {
        const dataByFactorId = _.groupBy(data, 'factor_id')
        return _.map(factorIds, factorId => dataByFactorId[factorId] || [])
      })
  }
}

module.exports = (rep, pgp) => new factorLevelRepo(rep, pgp)
