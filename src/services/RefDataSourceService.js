import db from '../db/DbManager'
import AppError from './utility/AppError'
import log4js from 'log4js'

const logger = log4js.getLogger('RefDataSourceService')

class RefDataSourceService {

    getRefDataSources(){
        return db.refDataSource.all()
    }

    getRefDataSourceById(id){
        return db.refDataSource.find(id).then((data)=>{
            if(!data){
                logger.error('Ref Data Source Not Found for requested id = ' + id)
                throw AppError.notFound('Ref Data Source Not Found for requested id')
            } else {
                return data
            }
        })
    }

    getRefDataSourcesByRefDataSourceTypeId(id) {
        return db.refDataSource.findByTypeId(id)
    }

    getCompleteRefDataSourceById(id){
        return db.refDataSource.find(id).then((data)=>{
            if(!data){
                logger.error('Ref Data Source Not Found for requested id = ' + id)
                throw AppError.notFound('Ref Data Source Not Found for requested id')
            } else {
                return db.refDataSourceType.find(data.ref_data_source_type_id).then((refDataSourceType)=>{
                    data["ref_data_source_type"] = refDataSourceType
                    return data
                })
            }
        })
    }
}

module.exports = RefDataSourceService