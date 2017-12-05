import * as _ from 'lodash'
import log4js from 'log4js'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import db from '../db/DbManager'
import ExperimentsService from './ExperimentsService'
import FactorsValidator from '../validations/FactorsValidator'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('FactorService')

class FactorService {
  constructor() {
    this.validator = new FactorsValidator()
    this.experimentService = new ExperimentsService()
  }

  @Transactional('batchCreateFactors')
  batchCreateFactors = (factors, context, tx) => this.validator.validate(factors, 'POST', tx)
      .then(() => db.factor.batchCreate(factors, context, tx)
        .then(data => AppUtil.createPostResponse(data)))

  @Transactional('getAllFactors')
  getAllFactors = tx => db.factor.all(tx)

  @Transactional('getFactorsByExperimentId')
  getFactorsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.factor.findByExperimentId(id, tx))
  }

  @Transactional('getFactorsByExperimentIdNoExistenceCheck')
  static getFactorsByExperimentIdNoExistenceCheck(id, tx) {
    return db.factor.findByExperimentId(id, tx)
  }

  @Transactional('getFactorById')
  getFactorById = (id, context, tx) => db.factor.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.transactionId}]] Factor Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchUpdateFactors')
  batchUpdateFactors = (factors, context, tx) => this.validator.validate(factors, 'PUT', tx)
      .then(() => db.factor.batchUpdate(factors, context, tx)
        .then(data => AppUtil.createPutResponse(data)))

  @Transactional('batchDeleteFactors')
  batchDeleteFactors = (ids, context, tx) => db.factor.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error(`[[${context.transactionId}]] Not all factors requested for delete were found`)
        throw AppError.notFound('Not all factors requested for delete were found')
      } else {
        return data
      }
    })
}

module.exports = FactorService
