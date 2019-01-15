import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5JXXXX
class unitRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5J0000')
  repository = () => this.rep

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

  @setErrorCode('5J7000')
  batchFindAllBySetId = (setId, tx = this.rep) => tx.any('SELECT t.treatment_number, u.id, u.treatment_id, u.rep, u.set_entry_id, u.location, u.block FROM unit u INNER JOIN treatment t ON u.treatment_id = t.id\n' +
    'INNER JOIN location_association la ON la.experiment_id = t.experiment_id AND la.location = u.location AND la.block IS NOT DISTINCT FROM u.block AND la.set_id = $1;', setId)

  @setErrorCode('5JE000')
  batchFindAllBySetIds = (setIds, tx = this.rep) => tx.any('SELECT la.set_id, u.* from location_association la\n' +
    'INNER JOIN unit u ON la.location = u.location AND la.block IS NOT DISTINCT FROM u.block\n' +
    'INNER JOIN treatment t ON t.id = u.treatment_id AND t.experiment_id = la.experiment_id\n' +
    'WHERE la.set_id IN ($1:csv)', [setIds]).then(data => {
    const unitsGroupedBySet = _.groupBy(data, 'set_id')
    return _.map(setIds, setId => _.map(unitsGroupedBySet[setId] || [], unit => _.omit(unit, ['set_id'])))
  })

  @setErrorCode('5J8000')
  batchFindAllBySetEntryIds = (setEntryIds, tx = this.rep) => tx.any('SELECT t.treatment_number, u.treatment_id, u.rep, u.set_entry_id FROM unit u INNER JOIN treatment t ON u.treatment_id = t.id WHERE set_entry_id IN ($1:csv)', [setEntryIds])

  @setErrorCode('5J9000')
  batchCreate = (units, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['treatment_id', 'rep', 'set_entry_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date', 'location', 'block'],
      { table: 'unit' },
    )

    const values = units.map(u => ({
      treatment_id: u.treatmentId,
      rep: u.rep,
      set_entry_id: u.setEntryId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      location: u.location,
      block: u.block,
    }))

    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5JA000')
  batchUpdate = (units, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'treatment_id', 'rep', {
        name: 'set_entry_id',
        cast: 'int',
      }, 'modified_user_id', 'modified_date', { name: 'location', cast: 'int' }, { name: 'block', cast: 'int' }],
      { table: 'unit' },
    )

    const data = units.map(u => ({
      id: u.id,
      treatment_id: u.treatmentId,
      rep: u.rep,
      set_entry_id: u.setEntryId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      location: u.location,
      block: u.block,
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

  @setErrorCode('5JH000')
  batchClearEntryIds = (setId, tx = this.rep) => {
    if (!setId) {
      return Promise.resolve()
    }

    return tx.none('UPDATE unit u SET set_entry_id = NULL\n' +
      'FROM treatment t, location_association la\n' +
      'WHERE u.treatment_id = t.id AND t.experiment_id = la.experiment_id AND u.location = la.location AND u.block IS NOT DISTINCT FROM la.block AND la.set_id = $1', setId)
  }

  @setErrorCode('5JI000')
  batchFindAllByExperimentIdLocationAndBlock = (experimentId, location, block, tx = this.rep) => {
    return tx.any('SELECT u.* FROM unit u INNER JOIN treatment t on u.treatment_id = t.id WHERE t.experiment_id=$1 AND u.location=$2 AND u.block IS NOT DISTINCT FROM $3', [experimentId, location, block])
  }
}

module.exports = (rep, pgp) => new unitRepo(rep, pgp)
