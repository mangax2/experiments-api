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
  findByLocationNumber = (experimentId, locationNumber, tx = this.rep) => tx.oneOrNone('SELECT * FROM location_association WHERE experiment_id = $1 AND locationNumber = $2', [experimentId, locationNumber])

  @setErrorCode('5P2000')
  findBySetId = (setId, tx = this.rep) => tx.oneOrNone('SELECT * FROM location_association WHERE set_id = $1', setId)
}

module.exports = (rep, pgp) => new locationAssociationRepo(rep, pgp)
