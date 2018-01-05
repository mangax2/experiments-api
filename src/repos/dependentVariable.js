import _ from 'lodash'

module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM dependent_variable WHERE id = $1', id),
  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM dependent_variable WHERE id IN ($1:csv)', [ids]),

  all: () => rep.any('SELECT * FROM dependent_variable'),

  findByExperimentId: (experimentId, tx = rep) => tx.any('SELECT * FROM dependent_variable where experiment_id=$1', experimentId),

  batchFindByExperimentId: (experimentIds, tx = rep) => {
    return tx.any('SELECT * FROM dependent_variable where experiment_id IN ($1:csv)', [experimentIds])
      .then(data => _.map(experimentIds, experimentId => _.filter(data, row => row.experiment_id === experimentId)))
  },

  batchCreate: (t, dependentVariables, context) => t.batch(dependentVariables.map(dependentVariable => t.one('insert into dependent_variable(required, name, experiment_id, created_user_id, created_date,' +
    'modified_user_id, modified_date, question_code) values($1, $2, $3, $4, CURRENT_TIMESTAMP,' +
    ' $4,' +
    ' CURRENT_TIMESTAMP,$5)  RETURNING id', [dependentVariable.required, dependentVariable.name, dependentVariable.experimentId, context.userId, dependentVariable.questionCode]),
  )),

  batchUpdate: (t, dependentVariables, context) => t.batch(dependentVariables.map(dependentVariable => t.oneOrNone('UPDATE dependent_variable SET (required, name, experiment_id,' +
    'modified_user_id, modified_date, question_code) = ($1,$2,$3,$4,CURRENT_TIMESTAMP,$5) WHERE' +
    ' id=$5 RETURNING *', [dependentVariable.required, dependentVariable.name, dependentVariable.experimentId, context.userId, dependentVariable.id, dependentVariable.questionCode]),
  )),

  removeByExperimentId: (tx, experimentId) => tx.any('DELETE FROM dependent_variable where experiment_id=$1 RETURNING id', experimentId),

  findByBusinessKey: (keys, tx = rep) => tx.oneOrNone('SELECT * FROM dependent_variable where experiment_id=$1 and name= $2', keys),

  batchFindByBusinessKey: (batchKeys, tx = rep) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      name: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, name, id) AS (VALUES ${pgp.helpers.values(values, ['experiment_id', 'name', 'id'])}) select entity.experiment_id, entity.name from public.dependent_variable entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.name = d.name and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  },
})
