import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5CXXXX
class groupTypeRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5C0000')
  repository = () => this.rep

  @setErrorCode('5C3000')
  batchFind = (ids, tx = this.rep) => {
    return tx.any('SELECT * FROM ref_group_type WHERE id IN ($1:csv)', [ids]).then(data => {
      const keyedData = _.keyBy(data, 'id')
      return _.map(ids, id => keyedData[id])
    })
  }
}

module.exports = rep => new groupTypeRepo(rep)