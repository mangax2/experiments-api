import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import FactorsValidator from '../validations/FactorsValidator'
import log4js from 'log4js'

const logger = log4js.getLogger('FactorService')

class FactorService {

    constructor() {
        this._validator = new FactorsValidator()
        this._experimentService = new ExperimentsService()
    }

    batchCreateFactors(factors, context) {
        return this._validator.validate(factors, 'POST').then(() => {
            return db.factor.repository().tx('createFactorsTx', (t) => {
                return db.factor.batchCreate(t, factors, context).then(data => {
                    return AppUtil.createPostResponse(data)
                })
            })
        })
    }

    getAllFactors() {
        return db.factor.all()
    }

    getFactorsByExperimentId(id) {
        return this._experimentService.getExperimentById(id).then(()=> {
            return db.factor.findByExperimentId(id)
        })
    }

    getFactorById(id) {
        return db.factor.find(id).then((data) => {
            if (!data) {
                logger.error('Factor Not Found for requested id = ' + id)
                throw AppError.notFound('Factor Not Found for requested id')
            } else {
                return data
            }
        })
    }

    batchUpdateFactors(factors, context) {
        return this._validator.validate(factors, 'PUT').then(() => {
            return db.factor.repository().tx('updateFactorsTx', (t) => {
                return db.factor.batchUpdate(t, factors, context).then(data => {
                    return AppUtil.createPutResponse(data)
                })
            })
        })
    }

    deleteFactor(id) {
        return db.factor.remove(id).then((data) => {
            if (!data) {
                logger.error('Factor Not Found for requested id = ' + id)
                throw AppError.notFound('Factor Not Found for requested id')
            } else {
                return data
            }
        })
    }
}

module.exports = FactorService