import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 51XXXX
class dependentVariableRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('510000')
  repository = () => this.rep

  @setErrorCode('511000')
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT * FROM dependent_variable WHERE id = $1', id)

  @setErrorCode('512000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM dependent_variable WHERE id IN ($1:csv)', [ids])

  @setErrorCode('513000')
  all = () => this.rep.any('SELECT * FROM dependent_variable')

  @setErrorCode('514000')
  findByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT * FROM dependent_variable where experiment_id=$1', experimentId)

  @setErrorCode('515000')
  batchCreate = (t, dependentVariables, context) => t.batch(dependentVariables.map(dependentVariable => t.one(
    'insert into dependent_variable(required, name, experiment_id, created_user_id, created_date,modified_user_id, modified_date, question_code) values($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP,$5)  RETURNING id',
    [dependentVariable.required, dependentVariable.name, dependentVariable.experimentId, context.userId, dependentVariable.questionCode])
  ))

  @setErrorCode('516000')
  batchUpdate = (t, dependentVariables, context) => t.batch(dependentVariables.map(dependentVariable => t.oneOrNone(
    'UPDATE dependent_variable SET (required, name, experiment_id, modified_user_id, modified_date, question_code) = ($1,$2,$3,$4,CURRENT_TIMESTAMP,$5) WHERE id=$5 RETURNING *',
    [dependentVariable.required, dependentVariable.name, dependentVariable.experimentId, context.userId, dependentVariable.id, dependentVariable.questionCode])
  ))

  @setErrorCode('517000')
  removeByExperimentId = (tx, experimentId) => tx.any('DELETE FROM dependent_variable where experiment_id=$1 RETURNING id', experimentId)

  @setErrorCode('518000')
  findByBusinessKey = (keys, tx = this.rep) => tx.oneOrNone('SELECT * FROM dependent_variable where experiment_id=$1 and name= $2', keys)

  @setErrorCode('510000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      name: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, name, id) AS (VALUES ${this.pgp.helpers.values(values, ['experiment_id', 'name', 'id'])}) select entity.experiment_id, entity.name from public.dependent_variable entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.name = d.name and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  }
}

module.exports = (rep, pgp) => new dependentVariableRepo(rep, pgp)
