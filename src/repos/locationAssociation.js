import _ from 'lodash'
import keyBy from 'lodash/keyBy'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5PXXXX
class locationAssociationRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5P0000')
  repository = () => this.rep

  @setErrorCode('5P5000')
  batchFindByIds = async (ids) => {
    const data = await this.rep.any('SELECT la.*, block.experiment_id FROM location_association la INNER JOIN block ON la.block_id = block.id WHERE la.id IN ($1:csv)', [ids])
    const keyedData = keyBy(data, 'id')
    return ids.map(id => keyedData[id] || new Error(`No location association for id ${id}`))
  }
      
  
  @setErrorCode('5P2000')
  findBySetId = (setId,) => this.rep.oneOrNone('SELECT * FROM location_association WHERE set_id = $1', setId)

  @setErrorCode('5P3000')
  findByExperimentId = (experimentId) => this.rep.any('SELECT la.*, b.name as block_name FROM location_association la, block b WHERE la.block_id = b.id AND b.experiment_id = $1', experimentId)

  @setErrorCode('5P7000')
  batchFindExperimentBySetId = (setIds) => {
    const promises = []

    if (setIds.includes('null')) {
      promises.push(this.rep.any('WITH experiment_location_blocks AS\n' +
      '(SELECT DISTINCT e.id, u.location, b.id as block_id FROM experiment e, unit u, treatment_block tb, block b ' +
        'WHERE u.treatment_block_id = tb.id AND tb.block_id = b.id AND b.experiment_id = e.id AND e.is_template = false),\n' +
        'experiment_ids_missing_setIds AS(\n' +
        'SELECT DISTINCT elb.id FROM experiment_location_blocks elb\n' +
        'LEFT JOIN location_association la ON la.block_id = elb.block_id AND elb.location = la.location WHERE la.set_id IS NULL)\n' +
        'SELECT e.* from experiment e, experiment_ids_missing_setIds eid WHERE e.id = eid.id ORDER BY id ASC;'))
    } else {
      promises.push(Promise.resolve())
    }

    const validSetIds = _.without(setIds, 'null')
    if (validSetIds.length > 0) {
      promises.push(this.rep.any('SELECT e.*, la.set_id FROM experiment e, location_association la, block b WHERE e.id = b.experiment_id and b.id = la.block_id and la.set_id IN ($1:csv)', [validSetIds]))
    } else {
      promises.push(Promise.resolve())
    }

    return Promise.all(promises).then(([experimentsNeedingSets, experimentsWithSets]) => {
      const values = []
      _.forEach(setIds, (setId) => {
        if (setId === 'null') {
          values.push(experimentsNeedingSets)
        } else {
          const experimentWithSet = _.find(experimentsWithSets, (exp) => exp.set_id === setId)
          if (experimentWithSet) {
            values.push([experimentWithSet])
          } else {
            values.push([])
          }
        }
      })

      return values
    })
  }

  @setErrorCode('5P4000')
  batchCreate = (associations, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'location',
        'set_id',
        'block_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw',
      ],
      {table: 'location_association'},
    )

    const values = associations.map(association => ({
      location: association.location,
      set_id: association.setId,
      block_id: association.block_id,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${this.pgp.helpers.insert(values, columnSet)}`

    return tx.none(query)
  }

  @setErrorCode('5P6000')
  batchRemoveByLocationAndBlock = (locationsAndBlocks, tx = this.rep) => {
    const promises = _.map(locationsAndBlocks, association =>
      tx.none('DELETE FROM location_association WHERE location = $1 AND block_id = $2', [association.location, association.block_id])
    )

    return tx.batch(promises)
  }

  @setErrorCode('5P8000')
  removeBySetId = (setId, tx = this.rep) =>
    tx.oneOrNone('DELETE FROM location_association la USING block b WHERE la.block_id = b.id AND la.set_id = $1 RETURNING b.experiment_id', setId)

  @setErrorCode('5P9000')
  findNumberOfLocationsAssociatedWithSets = (experimentId) =>
    this.rep.oneOrNone(
      'SELECT max(location) FROM location_association la, block b WHERE la.block_id = b.id and b.experiment_id = $1',
      experimentId,
    )
}

module.exports = (rep, pgp) => new locationAssociationRepo(rep, pgp)
