import db from '../db/DbManager'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import log4js from 'log4js'

const logger = log4js.getLogger('UnitTypeService')

class UnitTypeService {
    constructor() {
        this._experimentService = new ExperimentsService()
    }

    getUnitTypeById(id) {
        return db.unitType.find(id).then((data) => {
            if(!data) {
                logger.error('Unit Type Not Found for requested id = ' + id)
                throw AppError.notFound('Unit Type Not Found for requested id')
            }
            else {
                return data
            }
        })
    }

    getAllUnitTypes() {
        return db.unitType.all()
    }
}

module.exports = UnitTypeService