import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import UnitSpecificationDetailValidator from '../validations/UnitSpecificationDetailValidator'
import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('UnitSpecificationDetailService')

class UnitSpecificationDetailService {

    constructor() {
        this._validator = new UnitSpecificationDetailValidator()
        this._experimentService = new ExperimentsService()
    }

    @Transactional('getUnitSpecificationDetailsByExperimentId')
    getUnitSpecificationDetailsByExperimentId(id, tx) {
        return this._experimentService.getExperimentById(id, tx).then(()=> {
            return db.unitSpecificationDetail.findAllByExperimentId(id, tx)
        })
    }

    @Transactional('getUnitSpecificationDetailById')
    getUnitSpecificationDetailById(id, tx) {
        return db.unitSpecificationDetail.find(id, tx).then((data) => {
            if (!data) {
                logger.error('Unit Specification Detail Not Found for requested id = ' + id)
                throw AppError.notFound('Unit Specification Detail Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('getUnitSpecificationDetailsByIds')
    batchGetUnitSpecificationDetailsByIds(ids, tx) {
        return db.unitSpecificationDetail.batchFind(ids, tx).then((data) => {
            if (_.filter(data, (element) => element != null).length != ids.length) {
                logger.error('Unit Specification Detail not found for all requested ids.')
                throw AppError.notFound('Unit Specification Detail not found for all requested ids.')
            } else {
                return data
            }
        })
    }

    @Transactional('batchCreateUnitSpecificationDetails')
    batchCreateUnitSpecificationDetails(specificationDetails, context, tx) {
        return this._validator.validate(specificationDetails, 'POST', tx).then(() => {
            return db.unitSpecificationDetail.batchCreate(specificationDetails, context, tx).then(data => {
                return AppUtil.createPostResponse(data)
            })
        })
    }

    @Transactional('batchUpdateUnitSpecificationDetails')
    batchUpdateUnitSpecificationDetails(unitSpecificationDetails, context, tx) {
        return this._validator.validate(unitSpecificationDetails, 'PUT', tx).then(() => {
            return db.unitSpecificationDetail.batchUpdate(unitSpecificationDetails, context, tx).then(data => {
                return AppUtil.createPutResponse(data)
            })
        })
    }
}

module.exports = UnitSpecificationDetailService