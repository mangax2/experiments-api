module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM factor WHERE id = $1', id),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM factor WHERE id IN ($1:csv)', [ids]),

  findByExperimentId: (experimentId, tx = rep) => tx.any('SELECT * FROM factor WHERE' +
    ' experiment_id=$1', experimentId),

  all: (tx = rep) => tx.any('SELECT * FROM factor'),

  batchCreate: (factors, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      [
        'name',
        'ref_factor_type_id',
        'ref_data_source_id',
        'experiment_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw',
        'tier:raw'
      ],
      {table: 'factor'})
    const values = factors.map(factor => ({
      name: factor.name,
      ref_factor_type_id: factor.refFactorTypeId,
      ref_data_source_id: factor.refDataSourceId,
      experiment_id: factor.experimentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      tier: `CAST(${factor.tier === undefined ? null : factor.tier} AS numeric)`
    }))
    const query = `${pgp.helpers.insert(values, columnSet)} RETURNING id`
    return tx.any(query)
  },

  batchUpdate: (factors, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      [
        '?id',
        'name',
        'ref_factor_type_id',
        'ref_data_source_id',
        'experiment_id',
        'modified_user_id',
        'modified_date:raw',
        'tier:raw'
      ],
      {table: 'factor'})
    const data = factors.map(factor => ({
      id: factor.id,
      name: factor.name,
      ref_factor_type_id: factor.refFactorTypeId,
      ref_data_source_id: factor.refDataSourceId,
      experiment_id: factor.experimentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      tier: `CAST(${factor.tier === undefined ? null : factor.tier} AS numeric)`
    }))
    const query = `${pgp.helpers.update(data, columnSet)} WHERE v.id = t.id RETURNING *`
    return tx.any(query)
  },

  batchRemove: (ids, tx = rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM factor WHERE id IN ($1:csv) RETURNING id', [ids])
  },

  removeByExperimentId: (experimentId, tx = rep) => tx.any('DELETE FROM factor WHERE experiment_id = $1 RETURNING id', experimentId),

  findByBusinessKey: (keys, tx = rep) => tx.oneOrNone('SELECT * FROM factor WHERE experiment_id=$1 and name=$2', keys),

  batchFindByBusinessKey: (batchKeys, tx = rep) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      name: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, name, id) AS (VALUES ${pgp.helpers.values(values, ['experiment_id', 'name', 'id'])}) select entity.experiment_id, entity.name from public.factor entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.name = d.name and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  },
})
