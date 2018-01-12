import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5KXXXX
class unitSpecificationRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5K0000')
  repository = () => this.rep

  @setErrorCode('5K1000')
  find = id => this.rep.oneOrNone('SELECT * FROM ref_unit_spec WHERE id = $1', id)

  @setErrorCode('5K2000')
  all = () => this.rep.any('SELECT * FROM ref_unit_spec')

  @setErrorCode('5K3000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM ref_unit_spec WHERE id IN ($1:csv)', [ids])
}

module.exports = rep => new unitSpecificationRepo(rep)
