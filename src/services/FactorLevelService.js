import * as _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import FactorLevelsValidator from '../validations/FactorLevelsValidator'
import FactorService from './FactorService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const factorLevelValueConstants = {
  CLUSTER: 'Cluster',
  COMPOSITE: 'Composite',
  EXACT: 'exact',
  PLACEHOLDER: 'placeholder',
  NO_TREATMENT: 'noTreatment',
}

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
        console.error(`[[${context.requestId}]] Not all factor levels requested for delete were found`)
        throw AppError.notFound('Not all factor levels requested for delete were found', undefined, getFullErrorCode('1C7001'))
      } else {
        return data
      }
    })

  @setErrorCode('1C8000')
  processFactorLevelValues = (treatmentVariables) => {
    const treatmentVariableLevels = _.flatMap(treatmentVariables, 'levels')
    const allProperties = this.flattenTreatmentVariableLevelValues(treatmentVariableLevels)

    // This is where we'd put treatment variable level value validation - IF WE HAD ANY
    // this.validateFactorLevelValueProperties(allProperties)

    this.populateValueType(allProperties)
  }

  @setErrorCode('1C9000')
  flattenTreatmentVariableLevelValues = variableLevels =>
    _.flatMap(variableLevels, level => this.flattenClusterOrComposite(level))

  @setErrorCode('1CA000')
  flattenClusterOrComposite = property =>
    _.flatMap(property.items, (item) => {
      if (item.objectType === factorLevelValueConstants.CLUSTER
        || item.objectType === factorLevelValueConstants.COMPOSITE) {
        return this.flattenClusterOrComposite(item)
      }
      return [item]
    })

  @setErrorCode('1CB000')
  populateValueType = (valueProperties) => {
    valueProperties.forEach((property) => {
      if (property.valueType
        || property.objectType === factorLevelValueConstants.CLUSTER
        || property.objectType === factorLevelValueConstants.COMPOSITE) {
        return
      }

      if (property.placeholder) {
        property.valueType = factorLevelValueConstants.PLACEHOLDER
      } else {
        property.valueType = factorLevelValueConstants.EXACT
      }
    })
  }
}

module.exports = FactorLevelService
