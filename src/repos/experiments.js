import _ from 'lodash'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 55XXXX
class experimentsRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('550000')
  repository = () => this.rep

  @setErrorCode('551000')
  find = (id, isTemplate) => this.rep.oneOrNone('SELECT * FROM experiment WHERE id = $1 AND is_template = $2', [id, isTemplate])
 
  @setErrorCode('55E000')
  findExperimentOrTemplate = (id) => this.rep.oneOrNone('SELECT * FROM experiment WHERE id = $1', [id]) 

  @setErrorCode('552000')
  batchFind = (ids) => this.rep.any('SELECT * FROM experiment WHERE id IN ($1:csv)' ,[ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('553000')
  batchFindExperimentOrTemplate = (ids,isTemplate) => this.rep.any('SELECT * FROM experiment WHERE id IN ($1:csv) AND is_template=$2', [ids, isTemplate]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('554000')
  all = (isTemplate) => this.rep.any('SELECT * FROM experiment where is_template = $1', isTemplate)

  @setErrorCode('555000')
  batchCreate = (experiments, context, tx = this.rep) => tx.batch(
    experiments.map(
      experiment => tx.one(
        'insert into experiment(name, description, ref_experiment_design_id, status, analysis_type, created_user_id, created_date, modified_user_id, modified_date, is_template, randomization_strategy_code) values($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $6, CURRENT_TIMESTAMP, $7, $8)  RETURNING id',
        [experiment.name,
          experiment.description,
          experiment.refExperimentDesignId,
          experiment.status || 'DRAFT',
          experiment.analysisModelType === 'External' ? 'External' : 'Internal',
          context.userId,
          experiment.isTemplate || false,
          experiment.randomizationStrategyCode
        ],
      ),
    ),
  )

  @setErrorCode('556000')
  update = (id, experimentObj, context, tx = this.rep) => tx.oneOrNone(
    'UPDATE experiment SET (name, description, ref_experiment_design_id, status, analysis_type, modified_user_id, modified_date, randomization_strategy_code) = ($1,$2,$3,$4,$5,$6, CURRENT_TIMESTAMP,$9) WHERE id=$7 AND is_template=$8 RETURNING *',
    [experimentObj.name, experimentObj.description, experimentObj.refExperimentDesignId, experimentObj.status, experimentObj.analysisModelType === 'External' ? 'External' : 'Internal', context.userId, id,experimentObj.isTemplate, experimentObj.randomizationStrategyCode])

  @setErrorCode('557000')
  remove = (id, isTemplate, tx = this.rep) => tx.oneOrNone('delete from experiment where id=$1 AND is_template = $2 RETURNING id', [id, isTemplate])

  @setErrorCode('558000')
  updateCapacityRequestSyncDate = (id, context, tx = this.rep) => tx.any('UPDATE experiment SET (capacity_request_sync_date, modified_user_id, modified_date) = (CURRENT_TIMESTAMP, $1, CURRENT_TIMESTAMP) WHERE id=$2 RETURNING id',
    [context.userId, id])

  @setErrorCode('559000')
  batchFindExperimentsByName = name =>
    this.rep.any('SELECT * FROM experiment WHERE name = $1 AND is_template = FALSE', name)

  @setErrorCode('559000')
  batchFindExperimentsByPartialName = name =>
    this.rep.any('SELECT * FROM experiment WHERE position(lower($1) IN lower(name)) > 0 AND is_template = FALSE', name)

  @setErrorCode('55B000')
  findExperimentsByUserIdOrGroup = (isTemplate, userId, groupIds) => this.rep.any(
    'SELECT e.* FROM experiment e INNER JOIN owner o ON e.id=o.experiment_id WHERE e.is_template=$1 AND (o.user_ids && ARRAY[UPPER($2)]::VARCHAR[] OR o.group_ids && ARRAY[$3:csv]::VARCHAR[])',
    [isTemplate, userId, groupIds])

  @setErrorCode('55C000')
  updateExperimentStatus = (experimentId, status, taskId, context, tx = this.rep) => {
    const query = `UPDATE experiment SET (status, task_id, modified_user_id, modified_date) = ($2, $3, $4, CURRENT_TIMESTAMP) WHERE id = $1`
    return tx.oneOrNone(query, [experimentId, status, taskId, context.userId])
  }

  @setErrorCode('55D000')
  updateStrategyCode = (experimentId, strategy, context, tx) => {
    if (!strategy) {
      return Promise.resolve()
    }
    return tx.oneOrNone('UPDATE experiment SET (randomization_strategy_code, modified_user_id, modified_date) = ($2, $3, CURRENT_TIMESTAMP) WHERE id = $1', [experimentId, strategy.endpoint, context.userId])
  }
}

module.exports = rep => new experimentsRepo(rep)
