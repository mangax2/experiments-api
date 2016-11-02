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

    _createOrUseExistingTransaction(tx, txName, callback) {
        if (tx) {
            return callback(tx)
        } else {
            return db.factor.repository().tx(txName, callback)
        }
    }

    batchCreateFactors(factors, optionalTransaction) {
        return this._validator.validate(factors, 'POST', optionalTransaction).then(() => {
            return this._createOrUseExistingTransaction(
                optionalTransaction,
                'createFactorsTx',
                (tx) => {
                    return db.factor.batchCreate(tx, factors).then(data => {
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

    batchUpdateFactors(factors) {
        return this._validator.validate(factors, 'PUT').then(() => {
            return db.factor.repository().tx('updateFactorsTx', (t) => {
                return db.factor.batchUpdate(t, factors).then(data => {
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

    deleteFactorsForExperimentId(id, optionalTransaction) {
        return this._createOrUseExistingTransaction(
            optionalTransaction,
            'deleteFactorsForExperimentId',
            (tx) => {
                return this._experimentService.getExperimentById(id, tx).then(() => {
                    return db.factor.removeByExperimentId(tx, id)
                })
            })
    }
}

module.exports = FactorService