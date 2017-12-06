module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM "group" WHERE id = $1', id),

  findRepGroupsBySetId: (setId, tx = rep) => tx.any('select g.*, gv.value as rep from (select' +
    ' g1.* from "group" g1, "group" g2 where g1.parent_id = g2.id and g2.set_id = $1) g inner' +
    ' join '+
      'group_value gv on gv.group_id = g.id and gv.name = \'repNumber\' ',setId),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM "group" WHERE id IN ($1:csv)', [ids]),

  findAllByExperimentId: (experimentId, tx = rep) => tx.any('SELECT id, experiment_id, parent_id, ref_randomization_strategy_id, ref_group_type_id, set_id  FROM "group" WHERE experiment_id=$1 ORDER BY id ASC', experimentId),

  batchCreate: (groups, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['experiment_id', 'parent_id', 'ref_randomization_strategy_id', 'ref_group_type_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'group' },
    )

    const values = groups.map(group => ({
      experiment_id: group.experimentId,
      parent_id: group.parentId,
      ref_randomization_strategy_id: group.refRandomizationStrategyId,
      ref_group_type_id: group.refGroupTypeId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  },

  batchUpdate: (groups, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['?id', 'experiment_id', {
        name: 'parent_id',
        cast: 'int',
      }, {
        name: 'ref_randomization_strategy_id',
        cast: 'int',
      }, 'ref_group_type_id', 'modified_user_id', 'modified_date'],
      { table: 'group' },
    )
    const data = groups.map(u => ({
      id: u.id,
      experiment_id: u.experimentId,
      parent_id: u.parentId,
      ref_randomization_strategy_id: u.refRandomizationStrategyId,
      ref_group_type_id: u.refGroupTypeId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  },

  partiallyUpdate: (groups, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['?id', 'set_id', 'modified_user_id', 'modified_date'],
      { table: 'group' },
    )
    const data = groups.map(group => ({
      id: group.id,
      set_id: group.setId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  },

  batchRemove: (ids, tx = rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM "group" WHERE id IN ($1:csv) RETURNING id', [ids])
  },

  removeByExperimentId: (experimentId, tx = rep) =>
    // Delete only top most groups DELETE CASCADE on parent_id will delete all child groups.
    tx.any('DELETE FROM "group" WHERE experiment_id = $1 and parent_id IS NULL RETURNING id', experimentId),

})
