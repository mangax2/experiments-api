import db from '../db/DbManager'
import AppError from './utility/AppError'
import log4js from 'log4js'
import _ from 'lodash'
import RefDataSourceService from './RefDataSourceService'

const logger = log4js.getLogger('RefDataSourceTypeService')

class RefDataSourceTypeService {

    constructor(){
        this._refDataSourceService = new RefDataSourceService()
    }

    getRefDataSourceTypes(){
        return db.refDataSourceType.all()
    }

    getRefDataSourceTypeById(id){
        return db.refDataSourceType.find(id).then((data)=>{
            if(!data){
                logger.error('Ref Data Source Type Not Found for requested id = ' + id)
                throw AppError.notFound('Ref Data Source Type Not Found for requested id')
            } else {
                return data
            }
        })
    }

    getRefDataSourceTypesWithDataSources(){
        return db.refDataSourceType.all().then((data) => {
            return this._refDataSourceService.getRefDataSources().then((refDataSources)=>{
                const dataSourcesGroupedByTypeId = _.groupBy(refDataSources, (rds) => { return rds.ref_data_source_type_id})

                return _.map(data.slice(), (d) => {
                    d.ref_data_sources = dataSourcesGroupedByTypeId[d.id] ? dataSourcesGroupedByTypeId[d.id] : []
                    return d
                })
            })
        })
    }
}

module.exports = RefDataSourceTypeService