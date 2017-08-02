import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentalUnitValidator from '../validations/ExperimentalUnitValidator'
import TreatmentService from './TreatmentService'
import ExperimentsService from './ExperimentsService'
import GroupService from './GroupService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentalUnitService')

class ExperimentalUnitService {
  constructor() {
    this.validator = new ExperimentalUnitValidator()
    this.treatmentService = new TreatmentService()
    this.experimentService = new ExperimentsService()
    this.groupService = new GroupService()
  }

  @Transactional('createExperimentalUnitsTx')
  batchCreateExperimentalUnits(experimentalUnits, context, tx) {
    return this.validator.validate(experimentalUnits, 'POST', tx)
      .then(() => db.unit.batchCreate(experimentalUnits, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('partialUpdateExperimentalUnitsTx')
  batchPartialUpdateExperimentalUnits(experimentalUnits, context, tx) {
    return this.validator.validate(experimentalUnits, 'PATCH', tx)
      .then(() => {
        ExperimentalUnitService.uniqueIdsCheck(experimentalUnits, 'id')
        ExperimentalUnitService.uniqueIdsCheck(experimentalUnits, 'setEntryId')

        return db.unit.batchPartialUpdate(experimentalUnits, context, tx)
          .then(data => AppUtil.createPutResponse(data))
      })
  }

  static uniqueIdsCheck(experimentalUnits, idKey) {
    const ids = _.map(experimentalUnits, idKey)
    if (ids.length !== _.uniq(ids).length) {
      throw AppError.badRequest(`Duplicate ${idKey}(s) in request payload`)
    }
  }

  @Transactional('getExperimentalUnitsByTreatmentId')
  getExperimentalUnitsByTreatmentId(id, tx) {
    return this.treatmentService.getTreatmentById(id, tx)
      .then(() => db.unit.findAllByTreatmentId(id, tx))
  }

  @Transactional('batchGetExperimentalUnitByTreatmentIds')
  batchGetExperimentalUnitsByTreatmentIds(ids, tx) {
    return this.treatmentService.batchGetTreatmentByIds(ids, tx)
      .then(() => db.unit.batchFindAllByTreatmentIds(ids, tx))
  }

  @Transactional('batchGetExperimentalUnitByGroupIds')
  batchGetExperimentalUnitsByGroupIds(ids, tx) {
    return this.groupService.batchGetGroupsByIds(ids, tx)
      .then(() => db.unit.batchFindAllByGroupIds(ids, tx))
  }

  @Transactional('batchGetExperimentalUnitByGroupIdsNoValidate')
  batchGetExperimentalUnitsByGroupIdsNoValidate = (ids, tx) =>
    db.unit.batchFindAllByGroupIds(ids, tx)

  @Transactional('getExperimentalUnitById')
  getExperimentalUnitById = (id, tx) => db.unit.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Experimental Unit Not Found for requested id = ${id}`)
        throw AppError.notFound('Experimental Unit Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('getExperimentalUnitsByExperimentId')
  getExperimentalUnitsByExperimentId(id, isTemplate, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, tx)
      .then(() => db.unit.findAllByExperimentId(id, tx))
  }

  @Transactional('getExperimentalUnitsByExperimentIdNoValidate')
  getExperimentalUnitsByExperimentIdNoValidate = (id, tx) =>
    db.unit.findAllByExperimentId(id, tx)

  @Transactional('batchUpdateExperimentalUnits')
  batchUpdateExperimentalUnits(experimentalUnits, context, tx) {
    return this.validator.validate(experimentalUnits, 'PUT', tx)
      .then(() => db.unit.batchUpdate(experimentalUnits, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @Transactional('deleteExperimentalUnit')
  deleteExperimentalUnit = (id, tx) => db.unit.remove(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Experimental Unit Not Found for requested id = ${id}`)
        throw AppError.notFound('Experimental Unit Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchDeleteExperimentalUnits')
  batchDeleteExperimentalUnits = (ids, tx) => db.unit.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error('Not all experimental units requested for delete were found')
        throw AppError.notFound('Not all experimental units requested for delete were found')
      } else {
        return data
      }
    })
}

module.exports = ExperimentalUnitService
