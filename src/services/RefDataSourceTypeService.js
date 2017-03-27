import db from "../db/DbManager"
import AppError from "./utility/AppError"
import log4js from "log4js"
import _ from "lodash"
import RefDataSourceService from "./RefDataSourceService"

const logger = log4js.getLogger("RefDataSourceTypeService")

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
                logger.error("Ref Data Source Type Not Found for requested id = " + id)
                throw AppError.notFound("Ref Data Source Type Not Found for requested id")
            } else {
                return data
            }
        })
    }

    getRefDataSourceTypesWithDataSources(){
        return db.refDataSourceType.all().then((data) => {
            return Promise.all(_.map(data, (d) => {
                return this._refDataSourceService.getRefDataSourcesByRefDataSourceTypeId(d.id)
            })).then((refDataSources) => {
                return _.map(data, (d, index)=>{
                    d["ref_data_sources"] = refDataSources[index]
                    return d
                })
            })
        })
    }
}

module.exports = RefDataSourceTypeService