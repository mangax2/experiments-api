import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5PXXXX
class locationAssociationRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5P0000')
  repository = () => this.rep

  @setErrorCode('5P1000')
  findByLocation = (experimentId, location, tx = this.rep) => tx.oneOrNone('SELECT * FROM location_association WHERE experiment_id = $1 AND location = $2', [experimentId, location])

  @setErrorCode('5P2000')
  findBySetId = (setId, tx = this.rep) => tx.oneOrNone('SELECT * FROM location_association WHERE set_id = $1', setId)

  @setErrorCode('5P3000')
  findByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT * FROM location_association WHERE experiment_id = $1', experimentId)

  @setErrorCode('5P7000')
  batchFindExperimentBySetId = (setIds, tx = this.rep) => {
    const promises = []


    if (setIds.includes('null')) {
      promises.push(tx.any('WITH experiment_location_pairs AS (\n' +
        'SELECT DISTINCT e.id, u.location FROM experiment e, unit u, treatment t\n' +
        'WHERE u.treatment_id = t.id AND t.experiment_id = e.id ),\n' +
        'experiment_ids_missing_setIds AS(\n' +
        'SELECT DISTINCT ela.id FROM experiment_location_pairs ela\n' +
        'LEFT JOIN location_association la ON ela.id = la.experiment_id AND ela.location = la.location WHERE la.experiment_id IS NULL)\n' +
        'SELECT e.* from experiment e, experiment_ids_missing_setIds eid WHERE e.id = eid.id ORDER BY id ASC;'))
    } else {
      promises.push(Promise.resolve())
    }

    const validSetIds = _.without(setIds, 'null')
    if (validSetIds.length > 0) {
      promises.push(tx.any('SELECT e.*, la.set_id FROM experiment e, location_association la WHERE e.id = la.experiment_id and la.set_id IN ($1:csv)', [validSetIds]))
    } else {
      promises.push(Promise.resolve())
    }

    return tx.batch(promises).then(([experimentsNeedingSets, experimentsWithSets]) => {
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
      ['experiment_id', 'location', 'set_id'],
      {table: 'location_association'},
    )

    const values = associations.map(association => ({
      experiment_id: association.experimentId,
      location: association.location,
      set_id: association.setId,
    }))

    const query = `${this.pgp.helpers.insert(values, columnSet)}`

    return tx.none(query)
  }

  @setErrorCode('5P5000')
  removeByExperimentIdAndLocation = (experimentId, location, tx = this.rep) =>
    tx.none('DELETE FROM location_association WHERE experiment_id = $1 AND location = $2', [experimentId, location])

  @setErrorCode('5P6000')
  batchRemoveByExperimentIdAndLocation = (experimentIdsAndLocations, tx = this.rep) => {
    const promises = _.map(experimentIdsAndLocations, association =>
      tx.none('DELETE FROM location_association WHERE experiment_id = $1 AND location = $2', [association.experimentId, association.location])
    )

    return tx.batch(promises)
  }

  @setErrorCode('5P8000')
  removeBySetId = (setId, tx = this.rep) =>
    tx.none('DELETE FROM location_association WHERE set_idd = $1', setId)
}

module.exports = (rep, pgp) => new locationAssociationRepo(rep, pgp)
