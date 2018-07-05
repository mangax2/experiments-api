import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5EXXXX
class ownerRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5E0000')
  repository = () => this.rep

  @setErrorCode('5E1000')
  findByExperimentId = (experimentId, tx = this.rep) => tx.oneOrNone('SELECT user_ids,' +
    ' group_ids,reviewer_ids FROM' +
    ' owner WHERE' +
    ' experiment_id = $1', experimentId)

  @setErrorCode('5E2000')
  batchFindByExperimentIds = (experimentIds, tx = this.rep) => tx.any('SELECT * FROM owner where experiment_id IN ($1:csv)', [experimentIds]).then(data => {
    const keyedData = _.keyBy(data, 'experiment_id')
    return _.map(experimentIds, experimentId => keyedData[experimentId])
  })

  @setErrorCode('5E3000')
  batchCreate = (experimentsOwners, context, tx = this.rep) => tx.batch(
    experimentsOwners.map(
      ownershipInfo => tx.one(
        'insert into owner(experiment_id, user_ids, group_ids, reviewer_ids,created_user_id, ' +
        ' created_date,' +
        'modified_user_id, modified_date) values($1, $2::varchar[], $3::varchar[],$4::varchar[],' +
        ' $5,' +
        ' CURRENT_TIMESTAMP, $5,' +
        ' CURRENT_TIMESTAMP)  RETURNING id',
        [ownershipInfo.experimentId,
          ownershipInfo.userIds,
          ownershipInfo.groupIds,
          ownershipInfo.reviewerIds,
          context.userId],
      ),
    ),
  )

  @setErrorCode('5E4000')
  batchUpdate = (experimentsOwners, context, tx = this.rep) => tx.batch(
    experimentsOwners.map(
      ownershipInfo => tx.oneOrNone(
        'UPDATE owner SET (user_ids, group_ids,reviewer_ids,' +
        'modified_user_id, modified_date) = ($1::varchar[], $2::varchar[], $3::varchar[], $4,' +
        ' CURRENT_TIMESTAMP) WHERE experiment_id=$5 RETURNING *',
        [
          ownershipInfo.userIds,
          ownershipInfo.groupIds,
          ownershipInfo.reviewerIds,
          context.userId,
          ownershipInfo.experimentId,
        ],
      ),
    ),
  )

  @setErrorCode('5E5000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM "owner" WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })
}

module.exports = rep => new ownerRepo(rep)
