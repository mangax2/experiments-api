import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
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
  batchCreateCombinationElements = async (combinationElements, context, tx) => {
    await this.validator.validate(combinationElements, 'POST')

    const data = await dbWrite.combinationElement.batchCreate(combinationElements, context, tx)
    return AppUtil.createPostResponse(data)
  }

  @setErrorCode('113000')
  getCombinationElementsByExperimentId = experimentId =>
    dbRead.combinationElement.findAllByExperimentId(experimentId)

  @setErrorCode('114000')
  batchGetCombinationElementsByTreatmentIds(ids, context) {
    return this.treatmentService.batchGetTreatmentByIds(ids, context)
      .then(() => dbRead.combinationElement.batchFindAllByTreatmentIds(ids))
  }

  @setErrorCode('115000')
  batchGetCombinationElementsByTreatmentIdsNoValidate = ids =>
    dbRead.combinationElement.batchFindAllByTreatmentIds(ids)

  @setErrorCode('117000')
  @Transactional('batchUpdateCombinationElements')
  batchUpdateCombinationElements = async (combinationElements, context, tx) => {
    await this.validator.validate(combinationElements, 'PUT')
    const data = await dbWrite.combinationElement.batchUpdate(combinationElements, context, tx)
    return AppUtil.createPutResponse(data)
  }

  @setErrorCode('118000')
  @Transactional('batchDeleteCombinationElements')
  batchDeleteCombinationElements = async (ids, context, tx) => {
    const data = await dbWrite.combinationElement.batchRemove(ids, tx)
    if (_.filter(data, element => element !== null).length !== ids.length) {
      console.error(`[[${context.requestId}]] Not all combination elements requested for delete were found`)
      throw AppError.notFound('Not all combination elements requested for delete were found', undefined, getFullErrorCode('118001'))
    } else {
      return data
    }
  }
}

module.exports = CombinationElementService
