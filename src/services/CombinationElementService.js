import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import CombinationElementValidator from '../validations/CombinationElementValidator'
import TreatmentService from './TreatmentService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('CombinationElementService')

class CombinationElementService {
  constructor() {
    this.validator = new CombinationElementValidator()
    this.treatmentService = new TreatmentService()
  }

  @Transactional('createCombinationElementTx')
  batchCreateCombinationElements(combinationElements, context, tx) {
    return this.validator.validate(combinationElements, 'POST', tx)
      .then(() => db.combinationElement.batchCreate(combinationElements, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('getCombinationElementsByTreatmentId')
  getCombinationElementsByTreatmentId(id, context, tx) {
    return this.treatmentService.getTreatmentById(id, context, tx)
      .then(() => db.combinationElement.findAllByTreatmentId(id, tx))
  }

  @Transactional('getCombinationElementsByExperimentId')
  getCombinationElementsByExperimentId = (experimentId, tx) =>
    db.combinationElement.findAllByExperimentId(experimentId, tx)

  @Transactional('batchGetCombinationElementsByTreatmentIds')
  batchGetCombinationElementsByTreatmentIds(ids, context, tx) {
    return this.treatmentService.batchGetTreatmentByIds(ids, context, tx)
      .then(() => db.combinationElement.batchFindAllByTreatmentIds(ids, tx))
  }

  @Transactional('batchGetCombinationElementsByTreatmentIdsNoValidate')
  batchGetCombinationElementsByTreatmentIdsNoValidate = (ids, tx) =>
    db.combinationElement.batchFindAllByTreatmentIds(ids, tx)

  @Transactional('getCombinationElementById')
  getCombinationElementById = (id, context, tx) => db.combinationElement.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Combination Element Not Found for requested id = ${id}`)
        throw AppError.notFound('Combination Element Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchUpdateCombinationElements')
  batchUpdateCombinationElements(combinationElements, context, tx) {
    return this.validator.validate(combinationElements, 'PUT', tx)
      .then(() => db.combinationElement.batchUpdate(combinationElements, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @Transactional('batchDeleteCombinationElements')
  batchDeleteCombinationElements = (ids, context, tx) => db.combinationElement.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error(`[[${context.requestId}]] Not all combination elements requested for delete were found`)
        throw AppError.notFound('Not all combination elements requested for delete were found')
      } else {
        return data
      }
    })
}

module.exports = CombinationElementService
