import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentalUnitValidator from '../validations/ExperimentalUnitValidator'
import TreatmentService from './TreatmentService'
import ExperimentsService from './ExperimentsService'
import GroupService from './GroupService'
import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentalUnitService')

class ExperimentalUnitService {

    constructor() {
        this._validator = new ExperimentalUnitValidator()
        this._treatmentService = new TreatmentService()
        this._experimentService = new ExperimentsService()
        this._groupService = new GroupService()
    }

    @Transactional('createExperimentalUnitsTx')
    batchCreateExperimentalUnits(experimentalUnits, context, tx) {
        return this._validator.validate(experimentalUnits, 'POST', tx).then(() => {
            return db.unit.batchCreate(experimentalUnits, context, tx).then(data => {
                return AppUtil.createPostResponse(data)
            })
        })
    }

    @Transactional('getExperimentalUnitsByTreatmentId')
    getExperimentalUnitsByTreatmentId(id, tx) {
        return this._treatmentService.getTreatmentById(id, tx).then(()=> {
            return db.unit.findAllByTreatmentId(id, tx)
        })
    }

    @Transactional('batchGetExperimentalUnitByTreatmentIds')
    batchGetExperimentalUnitsByTreatmentIds(ids, tx) {
        return this._treatmentService.batchGetTreatmentByIds(ids, tx).then(() => {
            return db.unit.batchFindAllByTreatmentIds(ids, tx)
        })
    }

    @Transactional('batchGetExperimentalUnitByGroupIds')
    batchGetExperimentalUnitsByGroupIds(ids, tx) {
        return this._groupService.batchGetGroupsByIds(ids, tx).then(() => {
            return db.unit.batchFindAllByGroupIds(ids, tx)
        })
    }



    @Transactional('getExperimentalUnitById')
    getExperimentalUnitById(id, tx) {
        return db.unit.find(id, tx).then((data) => {
            if (!data) {
                logger.error('Experimental Unit Not Found for requested id = ' + id)
                throw AppError.notFound('Experimental Unit Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('getExperimentalUnitsByExperimentId')
    getExperimentalUnitsByExperimentId(id, tx) {
        return this._experimentService.getExperimentById(id, tx).then(()=> {
            return db.unit.findAllByExperimentId(id, tx)
        })
    }

    @Transactional('batchUpdateExperimentalUnits')
    batchUpdateExperimentalUnits(experimentalUnits, context, tx) {
        return this._validator.validate(experimentalUnits, 'PUT', tx).then(() => {
            return db.unit.batchUpdate(experimentalUnits, context, tx).then(data => {
                return AppUtil.createPutResponse(data)
            })
        })
    }

    @Transactional('deleteExperimentalUnit')
    deleteExperimentalUnit(id, tx) {
        return db.unit.remove(id, tx).then((data) => {
            if (!data) {
                logger.error('Experimental Unit Not Found for requested id = ' + id)
                throw AppError.notFound('Experimental Unit Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('batchDeleteExperimentalUnits')
    batchDeleteExperimentalUnits(ids, tx) {
        return db.unit.batchRemove(ids, tx).then((data) => {
            if (_.filter(data, (element) => element != null).length != ids.length) {
                logger.error('Not all experimental units requested for delete were found')
                throw AppError.notFound('Not all experimental units requested for delete were found')
            } else {
                return data
            }
        })
    }


}

module.exports = ExperimentalUnitService