import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5CXXXX
class groupTypeRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5C0000')
  repository = () => this.rep

  @setErrorCode('5C1000')
  find = id => this.rep.oneOrNone('SELECT * FROM ref_group_type WHERE id = $1', id)

  @setErrorCode('5C2000')
  all = () => this.rep.any('SELECT * FROM ref_group_type')

  @setErrorCode('5C3000')
  batchFind = (ids, tx = rep) => {
    return tx.any('SELECT * FROM ref_group_type WHERE id IN ($1:csv)', [ids]).then(results => {
      return _.map(ids, id => _.find(results, result => result.id === id))
    })
  }
}

module.exports = rep => new groupTypeRepo(rep)