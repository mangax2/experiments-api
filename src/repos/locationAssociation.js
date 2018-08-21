// TODO update error codes

// import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5BXXXX
class locationAssociationRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5B0000')
  repository = () => this.rep

  @setErrorCode('5B1000')
  findByLocationNumber = (experimentId, locationNumber, tx = this.rep) => tx.oneOrNone('SELECT * FROM location_association WHERE experiment_id = $1 AND locationNumber = $2', [experimentId,locationNumber])

  @setErrorCode('5B2000')
  findBySetId = (setId, tx = this.rep) => tx.oneOrNone('SELECT * FROM location_association WHERE set_id = $1', setId)

  @setErrorCode('5B3000')
  batchCreate = (associations, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['experiment_id', 'location_number', 'set_id'],
      {table: 'location_assocation'},
    )

    const values = associations.map(association => ({
      experiment_id: association.experimentId,
      location_number: association.locationNumber,
      set_id: association.setId,
    }))

    const query = `${this.pgp.helpers.insert(values, columnSet)}`

    // TODO find out if Sets needs anything from the return!!!

    return tx.none(query)
  }

  @setErrorCode('5B4000')
  removeByExperimentIdAndLocationNumber = (experimentId, locationNumber, tx = this.rep) =>
    tx.none('DELETE FROM location_assocation WHERE experiment_id = $1 AND location_number = $2', [experimentId, locationNumber])

  // @setErrorCode('5B4000')
  // batchUpdate = (assocations, context, tx = this.rep) => {
  //
  // }

  // @setErrorCode('5B5000')
  // batchRemoveBySetIds = (setIds, context, tx = this.rep) => {
  //
  // }
}

module.exports = (rep, pgp) => new locationAssociationRepo(rep, pgp)
