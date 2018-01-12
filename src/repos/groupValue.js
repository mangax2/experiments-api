import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()
const columns = "gv.id, COALESCE(gv.name, f.name) AS name, gv.value, fl.value->'items' AS factor_level_value, fl.id AS factor_level_id, gv.group_id, gv.created_user_id, gv.created_date, gv.modified_user_id, gv.modified_date"
const tables = 'group_value gv LEFT OUTER JOIN factor_level fl ON gv.factor_level_id = fl.id LEFT OUTER JOIN factor f ON fl.factor_id = f.id'
const genericSqlStatement = `SELECT ${columns} FROM ${tables}`

// Error Codes 5DXXXX
class groupValueRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5D0000')
  repository = () => this.rep

  @setErrorCode('5D1000')
  find = (id, tx = this.rep) => tx.oneOrNone(`${genericSqlStatement} WHERE gv.id = $1`, id)

  @setErrorCode('5D2000')
  batchFind = (ids, tx = this.rep) => tx.any(`${genericSqlStatement} WHERE gv.id IN ($1:csv)`, [ids])

  @setErrorCode('5D3000')
  batchFindAllByExperimentId = (experimentId, tx = this.rep) => {
    if (!experimentId) {
      return Promise.reject('Invalid or missing experiment id.')
    }
    return tx.any(`${genericSqlStatement} WHERE gv.group_id IN (SELECT id FROM public.group WHERE experiment_id = $1)`, experimentId)
  }

  @setErrorCode('5D4000')
  batchCreate = (groupValues, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['name', 'value', 'factor_level_id', 'group_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'group_value' },
    )

    const values = groupValues.map(gv => ({
      name: gv.name,
      value: gv.value,
      factor_level_id: gv.factorLevelId,
      group_id: gv.groupId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5D5000')
  batchUpdate = (groupValues, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'name', 'value', 'factor_level_id', 'group_id', 'modified_user_id', 'modified_date'],
      { table: 'group_value' },
    )

    const data = groupValues.map(gv => ({
      id: gv.id,
      name: gv.name,
      value: gv.value,
      factor_level_id: gv.factorLevelId,
      group_id: gv.groupId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('5D6000')
  findByBusinessKey = (keys, tx = this.rep) => tx.oneOrNone('SELECT * FROM group_value WHERE group_id = $1 and name = $2', keys)

  @setErrorCode('5D7000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      name: obj.keys[1],
      group_id: obj.keys[0],
      id: obj.updateId,
    }))
    const query = `WITH d(group_id, name, id) AS (VALUES ${this.pgp.helpers.values(values, ['group_id', 'name', 'id'])}) select gv.group_id, gv.name from public.group_value gv inner join d on gv.group_id = CAST(d.group_id as integer) and gv.name = d.name and (d.id is null or gv.id != CAST(d.id as integer))`
    return tx.any(query)
  }
}

module.exports = (rep, pgp) => new groupValueRepo(rep, pgp)
