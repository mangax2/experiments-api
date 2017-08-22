const columns = "id,value,factor_id,created_user_id,created_date,modified_user_id,modified_date"


module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone(`SELECT ${columns} FROM factor_level_new WHERE id = $1`, id),

  batchFind: (ids, tx = rep) => tx.any(`SELECT ${columns} FROM factor_level_new WHERE id IN ($1:csv)`, [ids]),

  findByFactorId: factorId => rep.any(`SELECT ${columns} FROM factor_level_new WHERE factor_id = $1`, factorId),

  all: () => rep.any('SELECT ${columns} FROM factor_level_new'),

  batchCreate: (t, factorLevels, context) => t.batch(
    factorLevels.map(
      factorLevel => t.one(
        'INSERT INTO factor_level(value, factor_id, created_user_id, created_date, modified_user_id, modified_date) ' +
        'VALUES($1, $2, $3, CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP) RETURNING id',
        [factorLevel.value, factorLevel.factorId, context.userId],
      ),
    ),
  ),

  batchUpdate: (t, factorLevels, context) => t.batch(
    factorLevels.map(
      factorLevel => t.oneOrNone(
        'UPDATE factor_level SET (value, factor_id, modified_user_id, modified_date) = ' +
        '($1, $2, $3, CURRENT_TIMESTAMP) WHERE id = $4 RETURNING *',
        [factorLevel.value, factorLevel.factorId, context.userId, factorLevel.id],
      ),
    ),
  ),

  remove: id => rep.oneOrNone('DELETE FROM factor_level WHERE id = $1 RETURNING id', id),

  findByBusinessKey: (keys, tx) => tx.oneOrNone(`SELECT ${columns} FROM factor_level WHERE` +
    ' factor_id = $1' +
    ' and value = $2', keys),

  batchFindByBusinessKey: (batchKeys, tx = rep) => {
    const values = batchKeys.map(obj => ({
      factor_id: obj.keys[0],
      value: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(factor_id, value, id) AS (VALUES ${pgp.helpers.values(values, ['factor_id', 'value', 'id'])}) select entity.factor_id, entity.value from public.factor_level entity inner join d on entity.factor_id = CAST(d.factor_id as integer) and entity.value = d.value and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  },
})
