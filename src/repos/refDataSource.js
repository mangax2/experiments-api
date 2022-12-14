import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5FXXXX
class refDataSourceRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5F0000')
  repository = () => this.rep

  @setErrorCode('5F1000')
  find = id => this.rep.oneOrNone('SELECT * FROM ref_data_source WHERE id = $1', id)

  @setErrorCode('5F2000')
  findByTypeId = id => this.rep.any('SELECT * FROM ref_data_source WHERE ref_data_source_type_id = $1', id)

  @setErrorCode('5F3000')
  all = () => this.rep.any('SELECT * FROM ref_data_source')

  @setErrorCode('5F4000')
  batchFind = (ids) => this.rep.any('SELECT * FROM ref_data_source WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })
}

module.exports = rep => new refDataSourceRepo(rep)
