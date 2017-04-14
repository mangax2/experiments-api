module.exports = rep => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM experiment WHERE id = $1', id),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM experiment WHERE id IN ($1:csv)', [ids]),

  all: () => rep.any('SELECT * FROM experiment'),

  findExperimentsByTags: (lowerCaseTagNames, lowerCaseTagValues) => {
    const query = 'SELECT DISTINCT e.* from experiment e , tag t where t.experiment_id = e.id'
    if (lowerCaseTagNames.length > 0 && lowerCaseTagValues.length > 0) {
      return rep.any(`${query} and lower(t.name) IN ($1:csv) and lower(t.value) IN ($2:csv)`, [lowerCaseTagNames, lowerCaseTagValues])
    } else if (lowerCaseTagNames.length > 0) {
      return rep.any(`${query} and lower(t.name) IN ($1:csv)`, [lowerCaseTagNames])
    } else if (lowerCaseTagValues.length > 0) {
      return rep.any(`${query} and lower(t.value) IN ($1:csv)`, [lowerCaseTagValues])
    }
    return []
  },

  batchCreate: (experiments, context, tx = rep) => tx.batch(
    experiments.map(
      experiment => tx.one(
        'insert into experiment(name, description, ref_experiment_design_id, status,created_user_id, created_date,' +
        'modified_user_id, modified_date) values($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP)  RETURNING id',
        [experiment.name,
          experiment.description,
          experiment.refExperimentDesignId,
          experiment.status,
          context.userId],
      ),
    ),
  ),

  update: (id, experimentObj, context, tx = rep) => tx.oneOrNone('UPDATE experiment SET (name, description, ref_experiment_design_id,status,' +
    'modified_user_id, modified_date) = ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) WHERE id=$6 RETURNING *', [experimentObj.name, experimentObj.description, experimentObj.refExperimentDesignId, experimentObj.status, context.userId, id]),

  remove: id => rep.oneOrNone('delete from experiment where id=$1 RETURNING id', id),
})
