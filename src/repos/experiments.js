import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 55XXXX
class experimentsRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('550000')
  repository = () => this.rep

  @setErrorCode('551000')
  find = (id, isTemplate, tx = this.rep) => tx.oneOrNone('SELECT * FROM experiment WHERE id = $1 AND is_template = $2', [id, isTemplate])

  @setErrorCode('552000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM experiment WHERE id IN ($1:csv)' ,[ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('553000')
  batchFindExperimentOrTemplate = (ids,isTemplate, tx = this.rep) => tx.any('SELECT * FROM experiment WHERE id IN ($1:csv) AND is_template=$2', [ids, isTemplate]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('554000')
  all = (isTemplate) => this.rep.any('SELECT * FROM experiment where is_template = $1', isTemplate)

  @setErrorCode('555000')
  batchCreate = (experiments, context, tx = this.rep) => tx.batch(
    experiments.map(
      experiment => tx.one(
        'insert into experiment(name, description, ref_experiment_design_id, status,created_user_id, created_date, modified_user_id, modified_date,is_template) values($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP,$6)  RETURNING id',
        [experiment.name,
          experiment.description,
          experiment.refExperimentDesignId,
          experiment.status || 'DRAFT',
          context.userId,
          experiment.isTemplate || false],
      ),
    ),
  )

  @setErrorCode('556000')
  update = (id, experimentObj, context, tx = this.rep) => tx.oneOrNone(
    'UPDATE experiment SET (name, description, ref_experiment_design_id,status, modified_user_id, modified_date) = ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) WHERE id=$6 AND is_template=$7 RETURNING *',
    [experimentObj.name, experimentObj.description, experimentObj.refExperimentDesignId, experimentObj.status, context.userId, id,experimentObj.isTemplate])

  @setErrorCode('557000')
  remove = (id, isTemplate) => this.rep.oneOrNone('delete from experiment where id=$1 AND is_template = $2 RETURNING id', [id, isTemplate])

  @setErrorCode('558000')
  updateCapacityRequestSyncDate = (id, context, tx = this.rep) => tx.any('UPDATE experiment SET (capacity_request_sync_date, modified_user_id, modified_date) = (CURRENT_TIMESTAMP, $1, CURRENT_TIMESTAMP) WHERE id=$2 RETURNING id',
    [context.userId, id])

  batchFindExperimentsByName = (names, tx = this.rep) => tx.any('SELECT * FROM experiment WHERE name IN ($1:csv)', [names]).then(data => {
    const groupedData = _.groupBy(data, 'name')
    return _.map(names, name => groupedData[name])
  })
}

module.exports = rep => new experimentsRepo(rep)
