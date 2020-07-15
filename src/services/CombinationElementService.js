import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import CombinationElementValidator from '../validations/CombinationElementValidator'
import TreatmentService from './TreatmentService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 11XXXX
class CombinationElementService {
  constructor() {
    this.validator = new CombinationElementValidator()
    this.treatmentService = new TreatmentService()
  }

  @setErrorCode('111000')
  @Transactional('createCombinationElementTx')
  batchCreateCombinationElements(combinationElements, context, tx) {
    return this.validator.validate(combinationElements, 'POST', tx)
      .then(() => db.combinationElement.batchCreate(combinationElements, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('113000')
  @Transactional('getCombinationElementsByExperimentId')
  getCombinationElementsByExperimentId = (experimentId, tx) =>
    db.combinationElement.findAllByExperimentId(experimentId, tx)

  @setErrorCode('114000')
  @Transactional('batchGetCombinationElementsByTreatmentIds')
  batchGetCombinationElementsByTreatmentIds(ids, context, tx) {
    return this.treatmentService.batchGetTreatmentByIds(ids, context, tx)
      .then(() => db.combinationElement.batchFindAllByTreatmentIds(ids, tx))
  }

  @setErrorCode('115000')
  @Transactional('batchGetCombinationElementsByTreatmentIdsNoValidate')
  batchGetCombinationElementsByTreatmentIdsNoValidate = (ids, tx) =>
    db.combinationElement.batchFindAllByTreatmentIds(ids, tx)

  @setErrorCode('117000')
  @Transactional('batchUpdateCombinationElements')
  batchUpdateCombinationElements(combinationElements, context, tx) {
    return this.validator.validate(combinationElements, 'PUT', tx)
      .then(() => db.combinationElement.batchUpdate(combinationElements, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @setErrorCode('118000')
  @Transactional('batchDeleteCombinationElements')
  batchDeleteCombinationElements = (ids, context, tx) => db.combinationElement.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        console.error(`[[${context.requestId}]] Not all combination elements requested for delete were found`)
        throw AppError.notFound('Not all combination elements requested for delete were found', undefined, getFullErrorCode('118001'))
      } else {
        return data
      }
    })
}

module.exports = CombinationElementService
