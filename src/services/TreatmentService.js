import log4js from 'log4js'
import _ from 'lodash'
// import ctimestamp from 'console-timestamp'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import TreatmentValidator from '../validations/TreatmentValidator'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('TreatmentService')

class TreatmentService {
  constructor() {
    this.validator = new TreatmentValidator()
    this.experimentService = new ExperimentsService()
  }

  @Transactional('batchCreateTreatments')
  batchCreateTreatments(treatments, context, tx) {
    return this.validator.validate(treatments, 'POST', tx)
      .then(() => db.treatment.batchCreate(treatments, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('getTreatmentsByExperimentId')
  getTreatmentsByExperimentId(id, tx) {
    return this.experimentService.getExperimentById(id, tx)
      .then(() => db.treatment.findAllByExperimentId(id, tx))
  }

  @Transactional('getTreatmentById')
  getTreatmentById = (id, tx) => db.treatment.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Treatment Not Found for requested id = ${id}`)
        throw AppError.notFound('Treatment Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('getTreatmentById')
  batchGetTreatmentByIds = (ids, tx) => db.treatment.batchFind(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error('Treatment not found for all requested ids.')
        throw AppError.notFound('Treatment not found for all requested ids.')
      } else {
        return data
      }
    })

  @Transactional('batchUpdateTreatments')
  batchUpdateTreatments(treatments, context, tx) {
    return this.validator.validate(treatments, 'PUT', tx)
      .then(() => db.treatment.batchUpdate(treatments, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @Transactional('deleteTreatment')
  deleteTreatment = (id, tx) => db.treatment.remove(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Treatment Not Found for requested id = ${id}`)
        throw AppError.notFound('Treatment Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchDeleteTreatments')
  batchDeleteTreatments = (ids, tx) => db.treatment.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error('Not all treatments requested for delete were found')
        throw AppError.notFound('Not all treatments requested for delete were found')
      } else {
        return data
      }
    })

  @Transactional('deleteTreatmentsForExperimentId')
  deleteTreatmentsForExperimentId(id, tx) {
    return this.experimentService.getExperimentById(id, tx)
      .then(() => db.treatment.removeByExperimentId(id, tx))
  }
}

module.exports = TreatmentService
