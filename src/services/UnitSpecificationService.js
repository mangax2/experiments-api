import db from '../db/DbManager'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import log4js from 'log4js'

const logger = log4js.getLogger('UnitSpecificationService')

class UnitSpecificationService {
    constructor() {
        this._experimentService = new ExperimentsService()
    }

    getUnitSpecificationById(id) {
        return db.unitSpecification.find(id).then((data) => {
            if(!data) {
                logger.error('Unit Specification Not Found for requested id = ' + id)
                throw AppError.notFound('Unit Specification Not Found for requested id')
            }
            else {
                return data
            }
        })
    }

    getAllUnitSpecifications() {
        return db.unitSpecification.all()
    }
}

module.exports = UnitSpecificationService