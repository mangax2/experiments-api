import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import TreatmentBlockService from './TreatmentBlockService'
import TreatmentValidator from '../validations/TreatmentValidator'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1RXXXX
class TreatmentService {
  constructor() {
    this.validator = new TreatmentValidator()
    this.experimentService = new ExperimentsService()
    this.treatmentBlockService = new TreatmentBlockService()
  }

  @setErrorCode('1R1000')
  @Transactional('batchCreateTreatments')
  batchCreateTreatments(treatments, context, tx) {
    return this.validator.validate(treatments, 'POST')
      .then(() => dbWrite.treatment.batchCreate(treatments, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('1R4000')
  batchGetTreatmentByIds = (ids, context) => dbRead.treatment.batchFind(ids)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        console.error(`[[${context.requestId}]] Treatment not found for all requested ids.`)
        throw AppError.notFound('Treatment not found for all requested ids.', undefined, getFullErrorCode('1R4001'))
      } else {
        return data
      }
    })

  @setErrorCode('1R5000')
  @Transactional('batchUpdateTreatments')
  batchUpdateTreatments(treatments, context, tx) {
    return this.validator.validate(treatments, 'PUT')
      .then(() => dbWrite.treatment.batchUpdate(treatments, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @setErrorCode('1R6000')
  @Transactional('batchDeleteTreatments')
  batchDeleteTreatments = (ids, context, tx) => dbRead.unit.batchFindAllByTreatmentIds(ids)
    .then((units) => {
      if (_.some(units, u => !_.isNil(u.set_entry_id))) {
        throw AppError.badRequest('Cannot delete treatments that are used in sets', undefined, getFullErrorCode('1R6002'))
      }
      return dbWrite.treatment.batchRemove(ids, tx)
        .then((data) => {
          if (_.filter(data, element => element !== null).length !== ids.length) {
            console.error(`[[${context.requestId}]] Not all treatments requested for delete were found`)
            throw AppError.notFound('Not all treatments requested for delete were found', undefined, getFullErrorCode('1R6001'))
          } else {
            return data
          }
        })
    })
}

module.exports = TreatmentService
