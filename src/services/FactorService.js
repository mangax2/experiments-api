import * as _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import { dbRead, dbWrite } from '../db/DbManager'
import FactorsValidator from '../validations/FactorsValidator'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1DXXXX
class FactorService {
  constructor() {
    this.validator = new FactorsValidator()
  }

  @setErrorCode('1D1000')
  @Transactional('batchCreateFactors')
  batchCreateFactors = (factors, context, tx) => this.validator.validate(factors, 'POST')
    .then(() => dbWrite.factor.batchCreate(factors, context, tx)
      .then(data => AppUtil.createPostResponse(data)))

  @setErrorCode('1D2000')
  getAllFactors = () => dbRead.factor.all()

  @setErrorCode('1D3000')
  getFactorsByExperimentId = (id, isTemplate) =>
    dbRead.experiments.find(id, isTemplate)
      .then((experiment) => {
        if (experiment) {
          return dbRead.factor.findByExperimentId(id)
        }
        throw AppError.notFound(`No experiment found for id '${id}'.`, undefined, getFullErrorCode('1D3001'))
      })

  @setErrorCode('1D4000')
  static getFactorsByExperimentIdNoExistenceCheck(id) {
    return dbRead.factor.findByExperimentId(id)
  }

  @setErrorCode('1D6000')
  @Transactional('batchUpdateFactors')
  batchUpdateFactors = (factors, context, tx) => this.validator.validate(factors, 'PUT')
    .then(() => dbWrite.factor.batchUpdate(factors, context, tx)
      .then(data => AppUtil.createPutResponse(data)))

  @setErrorCode('1D7000')
  @Transactional('batchDeleteFactors')
  batchDeleteFactors = (ids, context, tx) => dbWrite.factor.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        console.error(`[[${context.requestId}]] Not all factors requested for delete were found`)
        throw AppError.notFound('Not all factors requested for delete were found', undefined, getFullErrorCode('1D7001'))
      } else {
        return data
      }
    })

  @setErrorCode('1D8000')
  @Transactional('updateFactorsForDesign')
  updateFactorsForDesign = (experimentId, randStrategy, tx) => {
    const { rules } = randStrategy
    const hasSplits = _.some(rules, (rule, key) => key.includes('grouping'))
    if (!hasSplits) {
      return dbWrite.factor.removeTiersForExperiment(experimentId, tx)
    }

    return Promise.resolve()
  }
}

module.exports = FactorService
