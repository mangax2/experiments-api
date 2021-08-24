import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5MXXXX
class unitTypeRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5M0000')
  repository = () => this.rep

  @setErrorCode('5M2000')
  all = () => this.rep.any('SELECT * FROM ref_unit_type')

  @setErrorCode('5M3000')
  batchFind = (ids) => this.rep.any('SELECT * FROM ref_unit_type WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })
}

module.exports = rep => new unitTypeRepo(rep)