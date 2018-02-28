import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5JXXXX
class unitRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5J0000')
  repository = () => this.rep

  @setErrorCode('5J1000')
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT * FROM unit WHERE id = $1', id)

  @setErrorCode('5J2000')
  findAllByTreatmentId = (treatmentId, tx = this.rep) => tx.any('SELECT * FROM unit WHERE treatment_id = $1', treatmentId)

  @setErrorCode('5J3000')
  getGroupsWithNoUnits =(setId,tx=this.rep) => tx.any('select k.id from (select g.* from (select g1.* from "group" g1, "group" g2 where g1.parent_id = g2.id and g2.set_id = $1) g inner join group_value gv on gv.group_id = g.id and gv.name = \'repNumber\') k WHERE NOT EXISTS (SELECT 1 FROM unit  WHERE unit.group_id = k.id)',setId)

  @setErrorCode('5J4000')
  findAllByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT u.* FROM unit u, treatment t WHERE u.treatment_id=t.id and t.experiment_id=$1', experimentId)

  @setErrorCode('5JE000')
  batchfindAllByExperimentIds = (experimentIds, tx = this.rep) => tx.any('SELECT u.*, t.experiment_id FROM unit u, treatment t WHERE u.treatment_id=t.id and t.experiment_id IN ($1:csv)', experimentIds)
    .then(data => {
      const unitByExperimentId = _.groupBy(data, 'experiment_id')
      return _.map(experimentIds, experimentId => {
        return unitByExperimentId[experimentId] || []
      })
    })

  @setErrorCode('5J5000')
  batchFindAllByTreatmentIds = (treatmentIds, tx = this.rep) => tx.any('SELECT * FROM unit WHERE treatment_id IN ($1:csv)', [treatmentIds])

  @setErrorCode('5J6000')
  batchFindAllByGroupIds = (groupIds, tx = this.rep) => tx.any('SELECT id, group_id, treatment_id, rep, set_entry_id FROM unit WHERE group_id IN ($1:csv)', [groupIds])

  @setErrorCode('5JF000')
  batchFindAllByGroupIdsAndGroupByGroupId = (groupIds, tx = this.rep) => {
    return tx.any('SELECT id, group_id, treatment_id, rep, set_entry_id FROM unit WHERE group_id IN ($1:csv)', [groupIds])
      .then(data => {
        const dataByGroupId = _.groupBy(data, 'group_id')
        return _.map(groupIds, groupId => dataByGroupId[groupId] || [])
      })
  }

  @setErrorCode('5J7000')
  batchFindAllBySetId = (setId, tx = this.rep) => tx.any('WITH RECURSIVE set_groups AS (SELECT id FROM public.group WHERE set_id = $1 UNION ALL SELECT g.id FROM public.group g INNER JOIN set_groups sg ON g.parent_id = sg.id) SELECT t.treatment_number, u.treatment_id, u.rep, u.set_entry_id FROM unit u INNER JOIN treatment t ON u.treatment_id = t.id INNER JOIN set_groups sg ON u.group_id = sg.id', setId)

  @setErrorCode('5JE000')
  batchFindAllBySetIds = (setIds, tx = this.rep) => tx.any('WITH RECURSIVE set_groups AS (SELECT set_id, id FROM public.group WHERE set_id IN ($1:csv) UNION ALL SELECT sg.set_id, g.id FROM public.group g INNER JOIN set_groups sg ON g.parent_id = sg.id) SELECT sg.set_id, u.* FROM unit u INNER JOIN set_groups sg ON u.group_id = sg.id', [setIds]).then(data => {
    const unitsGroupedBySet = _.groupBy(data, 'set_id')
    return _.map(setIds, setId => _.map(unitsGroupedBySet[setId] || [], unit => _.omit(unit, ['set_id'])))
  })

  @setErrorCode('5J8000')
  batchFindAllBySetEntryIds = (setEntryIds, tx = this.rep) => tx.any('SELECT t.treatment_number, u.treatment_id, u.rep, u.set_entry_id FROM unit u INNER JOIN treatment t ON u.treatment_id = t.id WHERE set_entry_id IN ($1:csv)', [setEntryIds])

  @setErrorCode('5J9000')
  batchCreate = (units, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
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

    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5JA000')
  batchUpdate = (units, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', { name: 'group_id', cast: 'int' }, 'treatment_id', 'rep', {
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
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('5JB000')
  batchPartialUpdate = (units, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'set_entry_id', 'modified_user_id', 'modified_date'],
      { table: 'unit' },
    )
    const data = units.map(u => ({
      id: u.id,
      set_entry_id: u.setEntryId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('5JC000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM unit WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('5JD000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM unit WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })
}

module.exports = (rep, pgp) => new unitRepo(rep, pgp)
