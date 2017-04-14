import log4js from 'log4js'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import FactorsValidator from '../validations/FactorsValidator'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('FactorService')

class FactorService {

  constructor() {
    this._validator = new FactorsValidator()
    this._experimentService = new ExperimentsService()
  }

  @Transactional('batchCreateFactors')
  batchCreateFactors(factors, context, tx) {
    return this._validator.validate(factors, 'POST', tx).then(() => db.factor.batchCreate(factors, context, tx).then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('getAllFactors')
  getAllFactors(tx) {
    return db.factor.all(tx)
  }

  @Transactional('getFactorsByExperimentId')
  getFactorsByExperimentId(id, tx) {
    return this._experimentService.getExperimentById(id, tx).then(() => db.factor.findByExperimentId(id, tx))
  }

  @Transactional('getFactorById')
  getFactorById(id, tx) {
    return db.factor.find(id, tx).then((data) => {
      if (!data) {
        logger.error(`Factor Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Not Found for requested id')
      } else {
        return data
      }
    })
  }

  @Transactional('batchUpdateFactors')
  batchUpdateFactors(factors, context, tx) {
    return this._validator.validate(factors, 'PUT', tx).then(() => db.factor.batchUpdate(factors, context, tx).then(data => AppUtil.createPutResponse(data)))
  }

  @Transactional('deleteFactor')
  deleteFactor(id, tx) {
    return db.factor.remove(id, tx).then((data) => {
      if (!data) {
        logger.error(`Factor Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Not Found for requested id')
      } else {
        return data
      }
    })
  }

  @Transactional('deleteFactorsForExperimentId')
  deleteFactorsForExperimentId(id, tx) {
    return this._experimentService.getExperimentById(id, tx).then(() => db.factor.removeByExperimentId(id, tx))
  }
}

module.exports = FactorService
