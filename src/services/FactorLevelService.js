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
  batchCreateFactorLevels(factorLevels, context, tx) {
    return this.validator.validate(factorLevels, 'POST', tx)
      .then(() => db.factorLevel.batchCreate(tx, factorLevels, context)
        .then(data => AppUtil.createPostResponse(data)))
  }

  getAllFactorLevels = () => db.factorLevel.all()

  getFactorLevelsByFactorId(id) {
    return this.factorService.getFactorById(id)
      .then(() => db.factorLevel.findByFactorId(id))
  }

  getFactorLevelById = id => db.factorLevel.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`Factor Level Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Level Not Found for requested id')
      } else {
        return data
      }
    })

  batchUpdateFactorLevels(factorLevels, context) {
    return this.validator.validate(factorLevels, 'PUT')
      .then(() => db.factorLevel.repository().tx('updateFactorLevelsTx', t => db.factorLevel.batchUpdate(t, factorLevels, context)
        .then(data => AppUtil.createPutResponse(data))))
  }

  deleteFactorLevel = id => db.factorLevel.remove(id)
    .then((data) => {
      if (!data) {
        logger.error(`Factor Level Not Found for requested id = ${id}`)
        throw AppError.notFound('Factor Level Not Found for requested id')
      } else {
        return data
      }
    })
}

module.exports = FactorLevelService
