import * as _ from 'lodash'
import log4js from 'log4js'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import FactorLevelsValidator from '../validations/FactorLevelsValidator'
import FactorService from './FactorService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('FactorLevelService')

class FactorLevelService {
  constructor() {
    this.validator = new FactorLevelsValidator()
    this.factorService = new FactorService()
  }

  @Transactional('createFactorLevelsTx')
  batchCreateFactorLevels = (factorLevels, context, tx) => this.validator.validate(factorLevels, 'POST', tx)
      .then(() => db.factorLevel.batchCreate(factorLevels, context, tx)
        .then(data => AppUtil.createPostResponse(data)))

  getAllFactorLevels = () => db.factorLevel.all()

  @Transactional('getFactorLevelsByExperimentIdNoExistenceCheck')
  static getFactorLevelsByExperimentIdNoExistenceCheck(id, tx) {
    return db.factorLevel.findByExperimentId(id, tx)
  }

  getFactorLevelsByFactorId(id, context) {
    return this.factorService.getFactorById(id, context)
      .then(() => db.factorLevel.findByFactorId(id))
  }

  getFactorLevelById = (id, context) => db.factorLevel.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.transactionId}]] Factor Level Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Level Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchUpdateFactorLevels')
  batchUpdateFactorLevels = (factorLevels, context, tx) => this.validator.validate(factorLevels, 'PUT', tx)
      .then(() => db.factorLevel.batchUpdate(factorLevels, context, tx)
        .then(data => AppUtil.createPutResponse(data)))

  deleteFactorLevel = id => db.factorLevel.remove(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.transactionId}]] Factor Level Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Level Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchDeleteFactorLevels')
  batchDeleteFactorLevels = (ids, context, tx) => db.factorLevel.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error(`[[${context.transactionId}]] Not all factor levels requested for delete were found`)
        throw AppError.notFound('Not all factor levels requested for delete were found')
      } else {
        return data
      }
    })
}

module.exports = FactorLevelService
