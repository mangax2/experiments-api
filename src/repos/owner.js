module.exports = rep => ({
  repository: () => rep,

  findByExperimentId: (experimentId, tx = rep) => tx.oneOrNone('SELECT user_ids, group_ids FROM' +
    ' owner WHERE' +
    ' experiment_id = $1', experimentId),

  batchFindByExperimentIds: (experimentIds, tx = rep) => tx.any('SELECT * FROM owner where' +
    ' experiment_id IN ($1:csv)', [experimentIds]),

  batchCreate: (experimentsOwners, context, tx = rep) => tx.batch(
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
  ),


  batchUpdate: (experimentsOwners, context, tx = rep) => tx.batch(
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
  ),

})
