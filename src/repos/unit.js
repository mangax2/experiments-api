import _ from 'lodash'

module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM unit WHERE id = $1', id),

  findAllByTreatmentId: (treatmentId, tx = rep) => tx.any('SELECT * FROM unit WHERE' +
    ' treatment_id = $1', treatmentId),


  getGroupsWithNoUnits:(setId,tx=rep) => tx.any('select k.id from (select g.* from (select' +
    '   g1.* from "group" g1, "group" g2 where g1.parent_id = g2.id and g2.set_id = $1) g inner' +
    ' join '+
  'group_value gv on gv.group_id = g.id and gv.name = \'repNumber\') k WHERE NOT EXISTS' +
  '  (SELECT 1 FROM unit  WHERE unit.group_id = k.id)',setId),

  findAllByExperimentId: (experimentId, tx = rep) => tx.any('SELECT u.* FROM unit u, treatment t WHERE u.treatment_id=t.id and t.experiment_id=$1', experimentId),

  batchFindAllByTreatmentIds: (treatmentIds, tx = rep) => tx.any('SELECT * FROM unit WHERE treatment_id IN ($1:csv)', [treatmentIds]),
  batchFindAllByGroupIds: (groupIds, tx = rep) => tx.any('SELECT id, group_id, treatment_id, rep, set_entry_id FROM unit WHERE group_id IN ($1:csv)', [groupIds]),
  batchFindAllByGroupIdsAndGroupByGroupId: (groupIds, tx = rep) => {
    return tx.any('SELECT id, group_id, treatment_id, rep, set_entry_id FROM unit WHERE group_id IN ($1:csv)', [groupIds])
      .then(data => _.map(groupIds, groupId => _.filter(data, row => row.group_id === groupId)))
  },
  batchFindAllBySetId: (setIds, tx = rep) => tx.any('WITH RECURSIVE set_groups AS (SELECT id FROM public.group WHERE set_id = $1 UNION ALL SELECT g.id FROM public.group g INNER JOIN set_groups sg ON g.parent_id = sg.id) SELECT t.treatment_number, u.treatment_id, u.rep, u.set_entry_id FROM unit u INNER JOIN treatment t ON u.treatment_id = t.id INNER JOIN set_groups sg ON u.group_id = sg.id', setId),
  // batchFindAllBySetIdRaw: (setIds, tx = rep) =>
  //   tx.any('WITH RECURSIVE set_groups AS (SELECT id FROM public.group WHERE set_id IN ($1:csv) UNION ALL SELECT g.id FROM public.group g INNER JOIN set_groups sg ON g.parent_id = sg.id) SELECT u.* FROM unit u INNER JOIN treatment t ON u.treatment_id = t.id INNER JOIN set_groups sg ON u.group_id = sg.id', setIds)
  //     .then(data => { console.log(data); return _.map(setIds, setId => _.filter(data, row => row.set_id === setId)) }
  //     ),
  batchFindAllBySetEntryIds: (setEntryIds, tx = rep) => tx.any('SELECT t.treatment_number, u.treatment_id, u.rep, u.set_entry_id FROM unit u INNER JOIN treatment t ON u.treatment_id = t.id WHERE set_entry_id IN ($1:csv)', [setEntryIds]),
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

  batchUpdate: (units, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['?id', 'group_id', 'treatment_id', 'rep', {
        name: 'set_entry_id',
        cast: 'int',
      }, 'modified_user_id', 'modified_date'],
      { table: 'unit' },
    )
    const data = units.map(u => ({
      id: u.id,
      group_id: u.groupId,
      treatment_id: u.treatmentId,
      rep: u.rep,
      set_entry_id: u.setEntryId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  },

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

  batchRemove: (ids, tx = rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM unit WHERE id IN ($1:csv) RETURNING id', [ids])
  },

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM unit WHERE id IN ($1:csv)', [ids]),
})
