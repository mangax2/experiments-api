import _ from 'lodash'
import db from '../db/DbManager'
import RefDataSourceService from './RefDataSourceService'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1LXXXX
class RefDataSourceTypeService {
  constructor() {
    this.refDataSourceService = new RefDataSourceService()
  }

  @setErrorCode('1L1000')
  getRefDataSourceTypes = () => db.refDataSourceType.all()

  @setErrorCode('1L2000')
  getRefDataSourceTypesWithDataSources() {
    return db.refDataSourceType.all()
      .then(data => this.refDataSourceService.getRefDataSources()
        .then((refDataSources) => {
          const dataSourcesGroupedByTypeId = _.groupBy(refDataSources, rds =>
            rds.ref_data_source_type_id,
          )

          return _.map(data.slice(), (d) => {
            d.ref_data_sources = dataSourcesGroupedByTypeId[d.id]
              ? dataSourcesGroupedByTypeId[d.id]
              : []
            return d
          })
        }),
      )
  }
}

module.exports = RefDataSourceTypeService
