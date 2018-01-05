import _ from 'lodash'
import db from '../db/DbManager'
import RefDataSourceService from './RefDataSourceService'

class RefDataSourceTypeService {
  constructor() {
    this.refDataSourceService = new RefDataSourceService()
  }

  getRefDataSourceTypes = () => db.refDataSourceType.all()

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
