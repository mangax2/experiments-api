import _ from "lodash"
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
  findByExperimentId = (experimentId, tx = this.rep) => tx.oneOrNone('SELECT user_ids, group_ids FROM' +
    ' owner WHERE' +
    ' experiment_id = $1', experimentId)

  @setErrorCode('5E2000')
  batchFindByExperimentIds = (experimentIds, tx = this.rep) => tx.any('SELECT * FROM owner where' +
    ' experiment_id IN ($1:csv)', [experimentIds])

  @setErrorCode('5E3000')
  batchCreate = (experimentsOwners, context, tx = this.rep) => tx.batch(
    experimentsOwners.map(
      ownershipInfo => tx.one(
        'insert into owner(experiment_id, user_ids, group_ids, created_user_id, ' +
        ' created_date,' +
        'modified_user_id, modified_date) values($1, $2::varchar[], $3::varchar[], $4,' +
        ' CURRENT_TIMESTAMP, $4,' +
        ' CURRENT_TIMESTAMP)  RETURNING id',
        [ownershipInfo.experimentId,
          ownershipInfo.userIds,
          ownershipInfo.groupIds,
          context.userId],
      ),
    ),
  )

  @setErrorCode('5E4000')
  batchUpdate = (experimentsOwners, context, tx = this.rep) => tx.batch(
    experimentsOwners.map(
      ownershipInfo => tx.oneOrNone(
        'UPDATE owner SET (user_ids, group_ids,' +
        'modified_user_id, modified_date) = ($1::varchar[], $2::varchar[], $3,' +
        ' CURRENT_TIMESTAMP) WHERE experiment_id=$4 RETURNING *',
        [
          ownershipInfo.userIds,
          ownershipInfo.groupIds,
          context.userId,
          ownershipInfo.experimentId,
        ],
      ),
    ),
  )

  @setErrorCode('5E5000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM "owner" WHERE id IN ($1:csv)', [ids])

  @setErrorCode('5E6000')
  graphQLBatchFindByExperimentId = (experimentIds, tx = this.rep) => {
    return tx.any('SELECT * FROM owner WHERE experiment_id IN ($1:csv)', [experimentIds])
      .then(data => _.map(experimentIds, experimentId => _.filter(data, row => row.experiment_id === experimentId)))
  }
}

module.exports = rep => new ownerRepo(rep)
