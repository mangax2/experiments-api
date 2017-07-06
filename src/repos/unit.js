module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM unit WHERE id = $1', id),

  findAllByTreatmentId: (treatmentId, tx = rep) => tx.any('SELECT * FROM unit WHERE treatment_id = $1', treatmentId),

  findAllByExperimentId: (experimentId, tx = rep) => tx.any('SELECT u.* FROM unit u, treatment t WHERE u.treatment_id=t.id and t.experiment_id=$1', experimentId),

  batchFindAllByTreatmentIds: (treatmentIds, tx = rep) => tx.any('SELECT * FROM unit WHERE treatment_id IN ($1:csv)', [treatmentIds]),
  batchFindAllByGroupIds: (groupIds, tx = rep) => tx.any('SELECT id, group_id, treatment_id, rep, set_entry_id FROM unit WHERE group_id IN ($1:csv)', [groupIds]),
  batchCreate: (units, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['group_id', 'treatment_id', 'rep', 'set_entry_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'unit' },
    )

    const values = units.map(u => ({
      group_id: u.groupId,
      treatment_id: u.treatmentId,
      rep: u.rep,
      set_entry_id: u.setEntryId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  },

  batchUpdate: (units, context, tx = rep) => tx.batch(
    units.map(
      u => tx.oneOrNone(
        'UPDATE unit SET (group_id, treatment_id, rep, set_entry_id, modified_user_id, modified_date) = ' +
        '($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) WHERE id = $6 RETURNING *',
        [u.groupId, u.treatmentId, u.rep, u.setEntryId, context.userId, u.id],
      ),
    ),
  ),

  batchPartialUpdate: (units, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['?id', 'set_entry_id', 'modified_user_id', 'modified_date'],
      { table: 'unit' },
    )
    const data = units.map(u => ({
      id: u.id,
      set_entry_id: u.setEntryId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  },

  remove: (id, tx = rep) => tx.oneOrNone('DELETE FROM unit WHERE id = $1 RETURNING id', id),

  batchRemove: (ids, tx = rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM unit WHERE id IN ($1:csv) RETURNING id', [ids])
  },

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM unit WHERE id IN ($1:csv)', [ids]),
})
