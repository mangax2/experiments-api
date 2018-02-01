import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5HXXXX
class refDesignSpecificationRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5H0000')
  repository = () => this.rep

  @setErrorCode('5H1000')
  find = id => this.rep.oneOrNone('SELECT * FROM ref_design_spec WHERE id = $1', id)

  @setErrorCode('5H2000')
  all = () => this.rep.any('SELECT * FROM ref_design_spec')

  @setErrorCode('5H3000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM ref_design_spec WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })
}

module.exports = rep => new refDesignSpecificationRepo(rep)
