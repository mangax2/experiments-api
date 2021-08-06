import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5GXXXX
class refDataSourceTypeRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5G0000')
  repository = () => this.rep

  @setErrorCode('5G1000')
  find = id => this.rep.oneOrNone('SELECT * FROM ref_data_source_type WHERE id = $1', id)

  @setErrorCode('5G2000')
  all = () => this.rep.any('SELECT * FROM ref_data_source_type')

  @setErrorCode('5G3000')
  batchFind = (ids) => this.rep.any('SELECT * FROM ref_data_source_type WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })
}

module.exports = rep => new refDataSourceTypeRepo(rep)
