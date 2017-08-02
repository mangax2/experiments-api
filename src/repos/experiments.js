module.exports = rep => ({
  repository: () => rep,

  find: (id, isTemplate, tx = rep) => tx.oneOrNone('SELECT * FROM experiment WHERE id = $1 AND' +
    ' is_template = $2', [id, isTemplate]),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM experiment WHERE id IN ($1:csv)' ,[ids]),

  batchFindExperimentOrTemplate: (ids,isTemplate, tx = rep) => tx.any('SELECT * FROM experiment' +
  ' WHERE id' +
  ' IN ($1:csv) AND is_template=$2' [ids,isTemplate]),


  all: (isTemplate) => rep.any('SELECT * FROM experiment where is_template = $1', isTemplate),

  batchCreate: (experiments, context, tx = rep) => tx.batch(
    experiments.map(
      experiment => tx.one(
        'insert into experiment(name, description, ref_experiment_design_id, status,created_user_id, created_date,' +
        'modified_user_id, modified_date,is_template) values($1, $2, $3, $4, $5,' +
        ' CURRENT_TIMESTAMP, $5,' +
        ' CURRENT_TIMESTAMP,$6)  RETURNING id',
        [experiment.name,
          experiment.description,
          experiment.refExperimentDesignId,
          experiment.status || 'DRAFT',
          context.userId,
          experiment.isTemplate || false],
      ),
    ),
  ),

  update: (id, experimentObj, context, tx = rep) => tx.oneOrNone('UPDATE experiment SET (name, description, ref_experiment_design_id,status,' +
    'modified_user_id, modified_date) = ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) WHERE' +
    ' id=$6 AND is_template=$7 RETURNING *', [experimentObj.name, experimentObj.description, experimentObj.refExperimentDesignId, experimentObj.status, context.userId, id,experimentObj.isTemplate]),

  remove: (id, isTemplate) => rep.oneOrNone('delete from experiment where id=$1 AND is_template =' +
    ' $2' +
    ' RETURNING id', [id, isTemplate]),
})
