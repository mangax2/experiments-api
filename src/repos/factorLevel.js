const columns = "id,value,factor_id,created_user_id,created_date,modified_user_id,modified_date"
const qualifiedColumns = "fl.id,fl.value,fl.factor_id,fl.created_user_id,fl.created_date,fl.modified_user_id,fl.modified_date"


module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone(`SELECT ${columns} FROM factor_level WHERE id = $1`, id),

  batchFind: (ids, tx = rep) => tx.any(`SELECT ${columns} FROM factor_level WHERE id IN ($1:csv) ORDER BY id asc`, [ids]),

  findByExperimentId: (experimentId, tx = rep) =>
    tx.any(`SELECT ${qualifiedColumns} FROM factor f inner join factor_level fl on f.id = fl.factor_id WHERE experiment_id=$1  ORDER BY  fl.id asc`, experimentId),

  findByFactorId: factorId => rep.any(`SELECT ${columns} FROM factor_level WHERE factor_id = $1`, factorId),

  all: () => rep.any('SELECT ${columns} FROM factor_level'),

  batchCreate: (factorLevels, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
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
      value: `CAST(${pgp.as.json(factorLevel.value)} AS jsonb)`,
      factor_id: factorLevel.factorId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))
    const query = `${pgp.helpers.insert(values, columnSet)} RETURNING id`
    return tx.any(query)
  },

  batchUpdate: (factorLevels, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
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
      value: `CAST(${pgp.as.json(factorLevel.value)} AS jsonb)`,
      factor_id: factorLevel.factorId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))
    const query = `${pgp.helpers.update(data, columnSet)} WHERE v.id = t.id RETURNING *`
    return tx.any(query)
  },

  remove: id => rep.oneOrNone('DELETE FROM factor_level WHERE id = $1 RETURNING id', id),

  batchRemove: (ids, tx = rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM factor_level WHERE id IN ($1:csv) RETURNING id', [ids])
  },

  findByBusinessKey: (keys, tx) => tx.oneOrNone(`SELECT ${columns} FROM factor_level WHERE` +
    ' factor_id = $1' +
    ' and value = $2', keys),

  batchFindByBusinessKey: (batchKeys, tx = rep) => {
    const values = batchKeys.map(obj => ({
      factor_id: obj.keys[0],
      value: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(factor_id, value, id) AS (VALUES ${pgp.helpers.values(values, ['factor_id', 'value', 'id'])}) select entity.factor_id, entity.value from public.factor_level entity inner join d on entity.factor_id = CAST(d.factor_id as integer) and entity.value = CAST(d.value as jsonb) and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  },
})
