import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import FactorLevelsValidator from '../validations/FactorLevelsValidator'
import FactorService from './factorService'
import log4js from 'log4js'

const logger = log4js.getLogger('FactorLevelService')

class FactorLevelService {

    constructor() {
        this._validator = new FactorLevelsValidator()
        this._factorService = new FactorService()
    }

    _createOrUseExistingTransaction(tx, txName, callback) {
        if (tx) {
            return callback(tx)
        } else {
            return db.factorLevel.repository().tx(txName, callback)
        }
    }

    batchCreateFactorLevels(factorLevels, optionalTransaction) {
        return this._validator.validate(factorLevels, 'POST', optionalTransaction).then(() => {
            return this._createOrUseExistingTransaction(optionalTransaction, 'createFactorLevelsTx', (tx) => {
                return db.factorLevel.batchCreate(tx, factorLevels).then(data => {
                    return AppUtil.createPostResponse(data)
                })
            })
        })
    }

    getAllFactorLevels() {
        return db.factorLevel.all()
    }

    getFactorLevelsByFactorId(id) {
        return this._factorService.getFactorById(id).then(()=> {
            return db.factorLevel.findByFactorId(id)
        })
    }

    getFactorLevelById(id) {
        return db.factorLevel.find(id).then((data) => {
            if (!data) {
                logger.error('Factor Level Not Found for requested id = ' + id)
                throw AppError.notFound('Factor Level Not Found for requested id')
            } else {
                return data
            }
        })
    }

    batchUpdateFactorLevels(factorLevels) {
        return this._validator.validate(factorLevels, 'PUT').then(() => {
            return db.factorLevel.repository().tx('updateFactorLevelsTx', (t) => {
                return db.factorLevel.batchUpdate(t, factorLevels).then(data => {
                    return AppUtil.createPutResponse(data)
                })
            })
        })
    }

    deleteFactorLevel(id) {
        return db.factorLevel.remove(id).then((data) => {
            if (!data) {
                logger.error('Factor Level Not Found for requested id = ' + id)
                throw AppError.notFound('Factor Level Not Found for requested id')
            } else {
                return data
            }
        })
    }
}

module.exports = FactorLevelService