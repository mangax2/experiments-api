import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import RefDataSourceService from './RefDataSourceService'

const logger = log4js.getLogger('RefDataSourceTypeService')

class RefDataSourceTypeService {
  constructor() {
    this.refDataSourceService = new RefDataSourceService()
  }

  getRefDataSourceTypes = () => db.refDataSourceType.all()

  getRefDataSourceTypeById = id => db.refDataSourceType.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`Ref Data Source Type Not Found for requested id = ${id}`)
        throw AppError.notFound('Ref Data Source Type Not Found for requested id')
      } else {
        return data
      }
    })

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
