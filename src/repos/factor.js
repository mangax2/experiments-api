module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM factor_new WHERE id = $1', id),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM factor_new WHERE id IN ($1:csv)', [ids]),

  findByExperimentId: (experimentId, tx = rep) => tx.any('SELECT * FROM factor_new WHERE' +
    ' experiment_id=$1', experimentId),

  all: (tx = rep) => tx.any('SELECT * FROM factor_new'),

  batchCreate: (factors, context, tx = rep) => tx.batch(
    factors.map(
      factor => tx.one(
        'INSERT INTO factor(name, ref_factor_type_id, ref_data_source_id, experiment_id, created_user_id, created_date, modified_user_id, modified_date, tier) ' +
        'VALUES($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP, $6) RETURNING id',
        [factor.name,
          factor.refFactorTypeId,
          factor.refDataSourceId,
          factor.experimentId,
          context.userId,
          factor.tier],
      ),
    ),
  ),

  batchUpdate: (factors, context, tx = rep) => tx.batch(
    factors.map(
      factor => tx.oneOrNone(
        'UPDATE factor SET ' +
        '(name, ref_factor_type_id, ref_data_source_id, experiment_id, modified_user_id, modified_date,     tier) = ' +
        '($1,   $2,                 $3,                 $4,            $5,               CURRENT_TIMESTAMP, $7) WHERE id=$6 RETURNING *',
        [factor.name,
          factor.refFactorTypeId,
          factor.refDataSourceId,
          factor.experimentId,
          context.userId,
          factor.id,
          factor.tier],
      ),
    ),
  ),

  remove: (id, tx = rep) => tx.oneOrNone('DELETE FROM factor WHERE id=$1 RETURNING id', id),

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
