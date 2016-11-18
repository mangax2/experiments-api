import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import CombinationElementValidator from '../validations/CombinationElementValidator'
import TreatmentService from './TreatmentService'
import log4js from 'log4js'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('CombinationElementService')

class CombinationElementService {

    constructor() {
        this._validator = new CombinationElementValidator()
        this._treatmentService = new TreatmentService()

    }

    @Transactional('createCombinationElementTx')
    batchCreateCombinationElements(combinationElements, context, tx) {
        return this._validator.validate(combinationElements, 'POST', tx).then(() => {
            return db.combinationElement.batchCreate(combinationElements, context, tx).then(data => {
                return AppUtil.createPostResponse(data)
            })
        })
    }

    @Transactional('getCombinationElementsByTreatmentId')
    getCombinationElementsByTreatmentId(id, tx) {
        return this._treatmentService.getTreatmentById(id, tx).then(()=> {
            return db.combinationElement.findAllByTreatmentId(id, tx)
        })
    }

    @Transactional('getCombinationElementById')
    getCombinationElementById(id, tx) {
        return db.combinationElement.find(id, tx).then((data) => {
            if (!data) {
                logger.error('Combination Element Not Found for requested id = ' + id)
                throw AppError.notFound('Combination Element Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('batchUpdateCombinationElements')
    batchUpdateCombinationElements(combinationElements, context, tx) {
        return this._validator.validate(combinationElements, 'PUT', tx).then(() => {
                return db.combinationElement.batchUpdate(combinationElements, context, tx).then(data => {
                    return AppUtil.createPutResponse(data)
                })
        })
    }

    @Transactional('deleteCombinationElement')
    deleteCombinationElement(id, tx) {
        return db.combinationElement.remove(id, tx).then((data) => {
            if (!data) {
                logger.error('Combination Element Not Found for requested id = ' + id)
                throw AppError.notFound('Combination Element Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('batchDeleteCombinationElements')
    batchDeleteCombinationElements(ids, tx) {
        return db.combinationElement.batchRemove(ids, tx).then((data) => {
            if (data.length != ids.length) {
                logger.error('Not all combination elements requested for delete were found')
                throw AppError.notFound('Not all combination elements requested for delete were found')
            } else {
                return data
            }
        })
    }
}

module.exports = CombinationElementService