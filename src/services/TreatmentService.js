import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import TreatmentValidator from '../validations/TreatmentValidator'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('TreatmentService')

// Error Codes 1RXXXX
class TreatmentService {
  constructor() {
    this.validator = new TreatmentValidator()
    this.experimentService = new ExperimentsService()
  }

  @setErrorCode('1R1000')
  @Transactional('batchCreateTreatments')
  batchCreateTreatments(treatments, context, tx) {
    return this.validator.validate(treatments, 'POST', tx)
      .then(() => db.treatment.batchCreate(treatments, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('1R2000')
  @Transactional('getTreatmentsByExperimentId')
  getTreatmentsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.treatment.findAllByExperimentId(id, tx))
  }

  @setErrorCode('1R4000')
  @Transactional('getTreatmentById')
  batchGetTreatmentByIds = (ids, context, tx) => db.treatment.batchFind(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error(`[[${context.requestId}]] Treatment not found for all requested ids.`)
        throw AppError.notFound('Treatment not found for all requested ids.', undefined, getFullErrorCode('1R4001'))
      } else {
        return data
      }
    })

  @setErrorCode('1R5000')
  @Transactional('batchUpdateTreatments')
  batchUpdateTreatments(treatments, context, tx) {
    return this.validator.validate(treatments, 'PUT', tx)
      .then(() => db.treatment.batchUpdate(treatments, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @setErrorCode('1R6000')
  @Transactional('batchDeleteTreatments')
  batchDeleteTreatments = (ids, context, tx) => db.treatment.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error(`[[${context.requestId}]] Not all treatments requested for delete were found`)
        throw AppError.notFound('Not all treatments requested for delete were found', undefined, getFullErrorCode('1R6001'))
      } else {
        return data
      }
    })
}

module.exports = TreatmentService
