import _ from 'lodash'
import groupBy from "lodash/groupBy"
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
  findAllByExperimentId = (experimentId) => this.rep.any('SELECT u.*, tb.treatment_id, tb.block_id, b.name AS block FROM unit u INNER JOIN treatment_block tb ON u.treatment_block_id = tb.id INNER JOIN block b ON tb.block_id = b.id WHERE b.experiment_id=$1', experimentId)

  @setErrorCode('5JD000')
  batchFind = (ids) => this.batchFindAllByIds(ids).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5J5000')
  batchFindAllByTreatmentIds = (treatmentIds) => this.rep.any('SELECT * FROM unit INNER JOIN treatment_block tb ON unit.treatment_block_id = tb.id\n' +
    'INNER JOIN treatment t ON tb.treatment_id = t.id WHERE t.id IN ($1:csv)', [treatmentIds])

  @setErrorCode('5J7000')
  batchFindAllBySetId = (setId, allowUnassociatedUnits) => this.rep.any('SELECT t.treatment_number, u.id, u.rep, u.set_entry_id, u.location, u.treatment_block_id, tb.treatment_id ' +
    'FROM unit u INNER JOIN treatment_block tb ON u.treatment_block_id = tb.id\n' +
    'INNER JOIN treatment t ON tb.treatment_id = t.id\n' +
    'INNER JOIN location_association la ON la.block_id = tb.block_id AND la.location = u.location AND la.set_id = $1\n' +
    (allowUnassociatedUnits ? '' : 'WHERE u.set_entry_id IS NOT NULL'), setId)

  @setErrorCode('5JE000')
  batchFindAllBySetIds = (setIds) => this.rep.any('SELECT la.set_id, u.*, tb.treatment_id, tb.block_id, b.name AS block FROM location_association la\n' +
    'INNER JOIN treatment_block tb ON tb.block_id = la.block_id\n' +
    'INNER JOIN unit u ON u.treatment_block_id = tb.id and u.location = la.location\n' +
    'INNER JOIN block b ON tb.block_id = b.id\n' +
    'WHERE la.set_id IN ($1:csv) AND u.set_entry_id IS NOT NULL', [setIds]).then(data => {
    const unitsGroupedBySet = _.groupBy(data, 'set_id')
    return _.compact(_.flatMap(setIds, setId =>
      _.map(unitsGroupedBySet[setId] || [], unit => _.omit(unit, ['set_id']))))
  })

  @setErrorCode('5JG000')
  batchFindByBlockIds = (ids) => this.rep.any('SELECT u.*, tb.treatment_id, tb.block_id, b.name AS block FROM unit u INNER JOIN treatment_block tb ON u.treatment_block_id = tb.id INNER JOIN block b on tb.block_id = b.id WHERE' +
    ' b.id IN' +
    ' ($1:csv)', [ids])
    .then(data => {
      const keyedData = _.groupBy(data, 'block_id')
      return _.map(ids, id => keyedData[id])
    })

  @setErrorCode('5J8000')
  batchFindAllBySetEntryIds = (setEntryIds) => this.rep.any('SELECT t.treatment_number, tb.treatment_id, u.rep, u.set_entry_id, u.id FROM unit u INNER JOIN treatment_block tb ON u.treatment_block_id = tb.id INNER JOIN treatment t ON tb.treatment_id = t.id WHERE set_entry_id IN ($1:csv)', [setEntryIds])
  
  @setErrorCode('5JH000')
  batchFindUnitDetailsBySetEntryIds = (setEntryIds) => this.rep.any(
    `SELECT
    t.treatment_number,
    tb.treatment_id,
    tb.block_id,
    b.name AS block,
    u.location,
    u.rep,
    u.set_entry_id,
    u.deactivation_reason,
    u.id 
    FROM unit u 
    INNER JOIN treatment_block tb ON u.treatment_block_id = tb.id 
    INNER JOIN treatment t ON tb.treatment_id = t.id
    INNER JOIN block b ON tb.block_id = b.id
    WHERE set_entry_id IN ($1:csv)`,
    [setEntryIds]
  )

  @setErrorCode('5JF000')
  batchFindAllByIds = (experimentalUnitIds) => this.rep.any('SELECT * FROM unit WHERE id IN ($1:csv)', [experimentalUnitIds])

  @setErrorCode('5JA000')
  batchFindByLocationBlockIds = async (ids) => {
    const data = await this.rep.any('SELECT unit.*, tb.treatment_id, tb.block_id, b.name AS block, la.id AS location_block_id FROM unit ' +
      'INNER JOIN treatment_block tb ON unit.treatment_block_id = tb.id ' +
      'INNER JOIN location_association la ON tb.block_id = la.block_id INNER JOIN block b ON tb.block_id = b.id ' +
      'WHERE unit.location = la.location AND la.id IN ($1:csv)', [ids])
    const groupByData = groupBy(data, 'location_block_id')
    return ids.map(id => groupByData[id])
  }
  
  @setErrorCode('5J9000')
  batchCreate = (units, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [{ name: 'treatment_block_id', cast: 'int' }, 'rep', 'set_entry_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date', 'location'],
      { table: 'unit' },
    )

    const values = units.map(u => ({
      treatment_block_id: u.treatmentBlockId,
      rep: u.rep,
      set_entry_id: u.setEntryId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      location: u.location,
    }))

    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5JA000')
  batchUpdate = (units, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', { name: 'treatment_block_id', cast: 'int' }, 'rep', {
        name: 'set_entry_id',
        cast: 'int',
      }, 'modified_user_id', 'modified_date', { name: 'location', cast: 'int' }],
      { table: 'unit' },
    )

    const data = units.map(u => ({
      id: u.id,
      treatment_block_id: u.treatmentBlockId,
      rep: u.rep,
      set_entry_id: u.setEntryId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      location: u.location,
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

  @setErrorCode('5JH000')
  batchClearEntryIdsBySetId = (setId, tx = this.rep) => {
    if (!setId) {
      return Promise.resolve()
    }

    return tx.none("UPDATE unit u SET set_entry_id = NULL, modified_date = CURRENT_TIMESTAMP, modified_user_id = 'SETS_USER' FROM treatment_block tb, location_association la\n" +
      'WHERE u.treatment_block_id = tb.id AND tb.block_id = la.block_id AND u.location = la.location AND la.set_id = $1', setId)
  }

  @setErrorCode('5JI000')
  batchFindAllByLocationAndTreatmentBlocks = (location, treatmentBlockIds) => {
    return this.rep.any('SELECT u.* FROM unit u WHERE u.location=$1 AND u.treatment_block_id IN ($2:csv)', [location, treatmentBlockIds])
  }

  @setErrorCode('5JK000')
  batchUpdateDeactivationReasons = (units, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'deactivation_reason', 'modified_user_id', 'modified_date'],
      { table: 'unit' },
    )
    const data = units.map(u => ({
      id: u.id,
      deactivation_reason: u.deactivationReason,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`
    return tx.any(query)
  }

  @setErrorCode('5JL000')
  batchUpdateSetEntryIds = (setEntryIdPairs, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'existing_set_entry_id',
        'incoming_set_entry_id',
      ],
      {table: 'temp_update_set_entry_ids'})
    const values = setEntryIdPairs.map(setEntryIdPair => ({
      existing_set_entry_id: setEntryIdPair.existingSetEntryId,
      incoming_set_entry_id: setEntryIdPair.incomingSetEntryId,
    }))

    const tempTableQuery = "DROP TABLE IF EXISTS temp_update_set_entry_ids;"
      + " CREATE TEMP TABLE temp_update_set_entry_ids(existing_set_entry_id INT, incoming_set_entry_id INT);"
      + ` ${this.pgp.helpers.insert(values, columnSet)};`
    const updateQuery = "UPDATE unit SET"
      + " set_entry_id = tusei.incoming_set_entry_id,"
      + " modified_user_id = $1,"
      + " modified_date = 'CURRENT_TIMESTAMP'" 
      + " FROM temp_update_set_entry_ids tusei WHERE unit.set_entry_id = tusei.existing_set_entry_id"

    return tx.query(tempTableQuery)
      .then(() => tx.any(updateQuery.replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP'), context.userId))
  }

  @setErrorCode('5JM000')
  batchFindSetEntryIds = async (setEntryIds) => {
    const units = await this.rep.any('SELECT u.set_entry_id, u.id FROM unit u WHERE set_entry_id IN ($1:csv)', [setEntryIds])
    return units.map(unit => unit.set_entry_id)
  }

  @setErrorCode('5JO000')
  batchClearEntryIds = (entryIds) => {
    if (!entryIds || entryIds.length === 0) {
      return
    }

    return this.rep.none("UPDATE unit SET set_entry_id = NULL, modified_date = CURRENT_TIMESTAMP, modified_user_id = 'SETS_USER' WHERE set_entry_id IN ($1:csv)", [entryIds])
  }

  @setErrorCode('5JN000')
  batchFindExperimentIdsByTreatmentBlockIds = (treatmentBlockIds) => {
    if (!treatmentBlockIds || treatmentBlockIds.length === 0) {
      return
    }

    return this.rep.any('SELECT t.experiment_id FROM treatment_block tb INNER JOIN treatment t ON tb.treatment_id = t.id WHERE tb.id IN ($1:csv)', [treatmentBlockIds])
  }
}

module.exports = (rep, pgp) => new unitRepo(rep, pgp)
