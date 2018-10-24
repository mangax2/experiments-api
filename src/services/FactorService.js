import * as _ from 'lodash'
import log4js from 'log4js'
import Transactional from '@monsantoit/pg-transactional'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import db from '../db/DbManager'
import ExperimentsService from './ExperimentsService'
import FactorsValidator from '../validations/FactorsValidator'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('FactorService')

// Error Codes 1DXXXX
class FactorService {
  constructor() {
    this.validator = new FactorsValidator()
    this.experimentService = new ExperimentsService()
  }

  @setErrorCode('1D1000')
  @Transactional('batchCreateFactors')
  batchCreateFactors = (factors, context, tx) => this.validator.validate(factors, 'POST', tx)
    .then(() => db.factor.batchCreate(factors, context, tx)
      .then(data => AppUtil.createPostResponse(data)))

  @setErrorCode('1D2000')
  @Transactional('getAllFactors')
  getAllFactors = tx => db.factor.all(tx)

  @setErrorCode('1D3000')
  @Transactional('getFactorsByExperimentId')
  getFactorsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.factor.findByExperimentId(id, tx))
  }

  @setErrorCode('1D4000')
  @Transactional('getFactorsByExperimentIdNoExistenceCheck')
  static getFactorsByExperimentIdNoExistenceCheck(id, tx) {
    return db.factor.findByExperimentId(id, tx)
  }

  @setErrorCode('1D5000')
  @Transactional('getFactorById')
  getFactorById = (id, context, tx) => db.factor.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Factor Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Not Found for requested id', undefined, getFullErrorCode('1D5001'))
      } else {
        return data
      }
    })

  @setErrorCode('1D6000')
  @Transactional('batchUpdateFactors')
  batchUpdateFactors = (factors, context, tx) => this.validator.validate(factors, 'PUT', tx)
    .then(() => db.factor.batchUpdate(factors, context, tx)
      .then(data => AppUtil.createPutResponse(data)))

  @setErrorCode('1D7000')
  @Transactional('batchDeleteFactors')
  batchDeleteFactors = (ids, context, tx) => db.factor.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error(`[[${context.requestId}]] Not all factors requested for delete were found`)
        throw AppError.notFound('Not all factors requested for delete were found', undefined, getFullErrorCode('1D7001'))
      } else {
        return data
      }
    })

  @setErrorCode('1D8000')
  @Transactional('updateFactorsForDesign')
  updateFactorsForDesign = (experimentId, randStrategy, tx) => {
    const rules = JSON.parse(randStrategy.rules)
    const hasSplits = _.some(rules, (rule, key) => key.includes('groupedAttribute'))

    if (!hasSplits) {
      return db.factor.removeTiersForExperiment(experimentId, tx)
    }

    return Promise.resolve()
  }
}

module.exports = FactorService
