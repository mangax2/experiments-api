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
}

module.exports = (rep, pgp) => new locationAssociationRepo(rep, pgp)
