const columns = "gv.id, COALESCE(gv.name, f.name) AS name, COALESCE(gv.value, fl.value->>'refId', fl.value->>'text') AS value, gv.group_id, gv.created_user_id, gv.created_date, gv.modified_user_id, gv.modified_date"
const tables = 'group_value_new gv LEFT OUTER JOIN factor_level_new fl ON gv.factor_level_id = fl.id LEFT OUTER JOIN factor_new f ON fl.factor_id = f.id'
const genericSqlStatement = `SELECT ${columns} FROM ${tables}`

module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone(`${genericSqlStatement} WHERE gv.id = $1`, id),

  batchFind: (ids, tx = rep) => tx.any(`${genericSqlStatement} WHERE gv.id IN ($1:csv)`, [ids]),

  findAllByGroupId: (groupId, tx = rep) => tx.any(`${genericSqlStatement} WHERE gv.group_id = $1`, groupId),

  batchFindAllByExperimentId: (experimentId, tx = rep) => {
    if (!experimentId) {
      return Promise.reject('Invalid or missing experiment id.')
    }
    return tx.any(`${genericSqlStatement} WHERE gv.group_id IN (SELECT id FROM public.group WHERE experiment_id = $1)`, experimentId)
  },

  batchCreate: (groupValues, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['name', 'value', 'group_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'group_value' },
    )

    const values = groupValues.map(gv => ({
      name: gv.name,
      value: gv.value,
      group_id: gv.groupId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  },

  batchUpdate: (groupValues, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['?id', 'name', 'value', 'group_id', 'modified_user_id', 'modified_date'],
      { table: 'group_value' },
    )

    const data = groupValues.map(gv => ({
      id: gv.id,
      name: gv.name,
      value: gv.value,
      group_id: gv.groupId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  },

  remove: (id, tx = rep) => tx.oneOrNone('DELETE FROM group_value WHERE id = $1 RETURNING id', id),

  batchRemove: (ids, tx = rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM group_value WHERE id IN ($1:csv) RETURNING id', [ids])
  },

  findByBusinessKey: (keys, tx = rep) => tx.oneOrNone('SELECT * FROM group_value WHERE group_id = $1 and name = $2', keys),

  batchFindByBusinessKey: (batchKeys, tx = rep) => {
    const values = batchKeys.map(obj => ({
      name: obj.keys[1],
      group_id: obj.keys[0],
      id: obj.updateId,
    }))
    const query = `WITH d(group_id, name, id) AS (VALUES ${pgp.helpers.values(values, ['group_id', 'name', 'id'])}) select gv.group_id, gv.name from public.group_value gv inner join d on gv.group_id = CAST(d.group_id as integer) and gv.name = d.name and (d.id is null or gv.id != CAST(d.id as integer))`
    return tx.any(query)
  },
})
