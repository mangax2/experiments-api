import * as _ from 'lodash'
import log4js from 'log4js'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import FactorLevelsValidator from '../validations/FactorLevelsValidator'
import FactorService from './FactorService'
import Transactional from '../decorators/transactional'
import { getFullErrorCode, setErrorCode } from '../decorators/setErrorDecorator'

const logger = log4js.getLogger('FactorLevelService')

// Error Codes 1CXXXX
class FactorLevelService {
  constructor() {
    this.validator = new FactorLevelsValidator()
    this.factorService = new FactorService()
  }

  @setErrorCode('1C1000')
  @Transactional('createFactorLevelsTx')
  batchCreateFactorLevels = (factorLevels, context, tx) => this.validator.validate(factorLevels, 'POST', tx)
    .then(() => db.factorLevel.batchCreate(factorLevels, context, tx)
      .then(data => AppUtil.createPostResponse(data)))

  @setErrorCode('1C2000')
  getAllFactorLevels = () => db.factorLevel.all()

  @setErrorCode('1C3000')
  @Transactional('getFactorLevelsByExperimentIdNoExistenceCheck')
  static getFactorLevelsByExperimentIdNoExistenceCheck(id, tx) {
    return db.factorLevel.findByExperimentId(id, tx)
  }

  @setErrorCode('1C4000')
  getFactorLevelsByFactorId(id, context) {
    return this.factorService.getFactorById(id, context)
      .then(() => db.factorLevel.findByFactorId(id))
  }

  @setErrorCode('1C5000')
  getFactorLevelById = (id, context) => db.factorLevel.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Factor Level Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Level Not Found for requested id', undefined, getFullErrorCode('1C5001'))
      } else {
        return data
      }
    })

  @setErrorCode('1C6000')
  @Transactional('batchUpdateFactorLevels')
  batchUpdateFactorLevels = (factorLevels, context, tx) => this.validator.validate(factorLevels, 'PUT', tx)
    .then(() => db.factorLevel.batchUpdate(factorLevels, context, tx)
      .then(data => AppUtil.createPutResponse(data)))

  @setErrorCode('1C7000')
  @Transactional('batchDeleteFactorLevels')
  batchDeleteFactorLevels = (ids, context, tx) => db.factorLevel.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error(`[[${context.requestId}]] Not all factor levels requested for delete were found`)
        throw AppError.notFound('Not all factor levels requested for delete were found', undefined, getFullErrorCode('1C7001'))
      } else {
        return data
      }
    })
}

module.exports = FactorLevelService
