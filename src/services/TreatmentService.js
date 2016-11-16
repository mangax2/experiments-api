import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import TreatmentValidator from '../validations/TreatmentValidator'
import log4js from 'log4js'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('TreatmentService')

class TreatmentService {

    constructor() {
        this._validator = new TreatmentValidator()
        this._experimentService = new ExperimentsService()
    }

    @Transactional('batchCreateTreatments')
    batchCreateTreatments(treatments, context, tx) {
        return this._validator.validate(treatments, 'POST', tx).then(() => {
            return db.treatment.batchCreate(treatments, context, tx).then(data => {
                return AppUtil.createPostResponse(data)
            })
        })
    }


    @Transactional('getTreatmentsByExperimentId')
    getTreatmentsByExperimentId(id, tx) {
        return this._experimentService.getExperimentById(id, tx).then(()=> {
            return db.treatment.findAllByExperimentId(id, tx)
        })
    }

    @Transactional('getTreatmentById')
    getTreatmentById(id, tx) {
        return db.treatment.find(id, tx).then((data) => {
            if (!data) {
                logger.error('Treatment Not Found for requested id = ' + id)
                throw AppError.notFound('Treatment Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('batchUpdateTreatments')
    batchUpdateTreatments(treatments, context, tx) {
        return this._validator.validate(treatments, 'PUT', tx).then(() => {
            return db.treatment.batchUpdate(treatments, context, tx).then(data => {
                return AppUtil.createPutResponse(data)
            })
        })
    }

    @Transactional('deleteTreatment')
    deleteTreatment(id, tx) {
        return db.treatment.remove(id, tx).then((data) => {
            if (!data) {
                logger.error('Treatment Not Found for requested id = ' + id)
                throw AppError.notFound('Treatment Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('deleteTreatmentsForExperimentId')
    deleteTreatmentsForExperimentId(id, tx) {
        return this._experimentService.getExperimentById(id, tx).then(() => {
            return db.treatment.removeByExperimentId(id, tx)
        })
    }
}

export default TreatmentService