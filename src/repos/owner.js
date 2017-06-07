module.exports = (rep, pgp) => ({
  repository: () => rep,

  findByExperimentId: (experimentId, tx = rep) => tx.oneOrNone('SELECT user_ids FROM owner WHERE' +
    ' experiment_id = $1', experimentId),

  batchFindByExperimentIds: (experimentIds, tx = rep) => tx.any('SELECT * FROM owner where' +
    ' experiment_id IN ($1:csv)', [experimentIds]),

  batchCreate: (experimentsOwners, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['experiment_id', 'user_ids', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date', 'group_ids'],
      { table: 'owner' },
    )

    const values = experimentsOwners.map(ownershipInfo => ({
      experiment_id: ownershipInfo.experimentId,
      user_ids: ownershipInfo.userIds,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      group_ids: ownershipInfo.groupIds,

    }))

    const query = `${pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  },

  batchUpdate: (experimentsOwners, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['?id', 'experiment_id', 'user_ids', 'group_ids', 'modified_user_id', 'modified_date'],
      { table: 'owner' },
    )

    const data = experimentsOwners.map(ownershipInfo => ({
      id: ownershipInfo.id,
      experiment_id: parseInt(ownershipInfo.experimentId, 10),
      user_ids: ownershipInfo.userIds,
      group_ids: ownershipInfo.groupIds,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.experiment_id = t.experiment_id RETURNING *`

    return tx.any(query)
  },
})
