import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5OXXXX
class commentRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5O0000')
  repository = () => this.rep

  @setErrorCode('5O1000')
  find = (id) => this.rep.oneOrNone('SELECT * FROM comment WHERE id = $1', id)

  @setErrorCode('5O2000')
  batchFind = (ids) => this.rep.any('SELECT * FROM comment WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5O3000')
  findByExperimentId = (experimentId) => this.rep.any('SELECT * FROM comment WHERE experiment_id=$1', experimentId)

  findRecentByExperimentId = (experimentId) => this.rep.oneOrNone('SELECT * FROM' +
    ' comment' +
    ' WHERE' +
    ' experiment_id=$1 order by id desc limit 1' , experimentId)

  @setErrorCode('5O4000')
  all = () => this.rep.any('SELECT * FROM comment')

  @setErrorCode('5O5000')
  batchCreate = (comments, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'description',
        'experiment_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw',
      ],
      {table: 'comment'})
    const values = comments.map(comment => ({
      description: comment.description || '',
      experiment_id: comment.experimentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet)} RETURNING id`
    return tx.any(query)
  }

  @setErrorCode('5O6000')
  batchUpdate = (t, comments, context) => t.batch(comments.map(comment => t.oneOrNone(
    'UPDATE comment SET (description,experiment_id, modified_user_id, modified_date) ' +
    '= ($1,$2,$3,CURRENT_TIMESTAMP) WHERE id=$4 RETURNING *',
    [comment.description, comment.experimentId, context.userId, comment.id])
  ))



  @setErrorCode('5OA000')
  batchFindByExperimentId = (experimentIds) => {
    return this.rep.any('SELECT * FROM comment WHERE experiment_id IN ($1:csv)', [experimentIds])
      .then(data => {
        const dataByExperimentId = _.groupBy(data, 'experiment_id')
        return _.map(experimentIds, experimentId => dataByExperimentId[experimentId] || [])
      })
  }
}

module.exports = (rep, pgp) => new commentRepo(rep, pgp)
