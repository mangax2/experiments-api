import * as _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import FactorLevelsValidator from '../validations/FactorLevelsValidator'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const factorLevelValueConstants = {
  CLUSTER: 'Cluster',
  COMPOSITE: 'Composite',
  EXACT: 'exact',
  PLACEHOLDER: 'placeholder',
  NO_TREATMENT: 'noTreatment',
}
const clusterAndCompositeTypes = [
  factorLevelValueConstants.CLUSTER,
  factorLevelValueConstants.COMPOSITE,
]
const validValueTypeInputs = [
  factorLevelValueConstants.EXACT,
  factorLevelValueConstants.PLACEHOLDER,
  factorLevelValueConstants.NO_TREATMENT,
]

// Error Codes 1CXXXX
class FactorLevelService {
  constructor() {
    this.validator = new FactorLevelsValidator()
  }

  @setErrorCode('1C1000')
  @Transactional('createFactorLevelsTx')
  batchCreateFactorLevels = (factorLevels, context, tx) => this.validator.validate(factorLevels, 'POST')
    .then(() => dbWrite.factorLevel.batchCreate(factorLevels, context, tx)
      .then(data => AppUtil.createPostResponse(data)))

  @setErrorCode('1C2000')
  getAllFactorLevels = () => dbRead.factorLevel.all()

  @setErrorCode('1C3000')
  static getFactorLevelsByExperimentIdNoExistenceCheck(id) {
    return dbRead.factorLevel.findByExperimentId(id)
  }

  @setErrorCode('1C6000')
  @Transactional('batchUpdateFactorLevels')
  batchUpdateFactorLevels = (factorLevels, context, tx) => this.validator.validate(factorLevels, 'PUT')
    .then(() => dbWrite.factorLevel.batchUpdate(factorLevels, context, tx)
      .then(data => AppUtil.createPutResponse(data)))

  @setErrorCode('1C7000')
  @Transactional('batchDeleteFactorLevels')
  batchDeleteFactorLevels = (ids, context, tx) => dbWrite.factorLevel.batchRemove(ids, tx)
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

    this.validateFactorLevelValueProperties(allProperties)

    this.populateValueType(allProperties)
    this.populateIsPlaceholderFromValueType(allProperties)
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

      if (property.isPlaceholder) {
        property.valueType = factorLevelValueConstants.PLACEHOLDER
      } else {
        property.valueType = factorLevelValueConstants.EXACT
      }
    })
  }

  @setErrorCode('1CC000')
  validateFactorLevelValueProperties = (valueProperties) => {
    const [clusterCatalogProps, valueProps] = _.partition(valueProperties,
      vp => clusterAndCompositeTypes.includes(vp.objectType))

    if (_.some(clusterCatalogProps, ccp => !_.isArray(ccp.items))) {
      throw AppError.badRequest('All Cluster and Composite properties must have an array named "items".', undefined, '1CC001')
    }

    if (_.some(valueProps, vp => _.isNil(vp.isPlaceholder) && _.isNil(vp.valueType))) {
      throw AppError.badRequest('All value properties must either specify "isPlaceholder", "valueType", or both of these.', undefined, '1CC002')
    }

    if (_.some(valueProps, vp => !_.isNil(vp.valueType) && !_.isNil(vp.isPlaceholder) &&
      this.areValueTypeAndPlaceholderMismatched(vp))) {
      throw AppError.badRequest('One or more value properties have mismatched "valueType" and "isPlaceholder" values', undefined, '1CC003')
    }

    if (_.some(valueProps, vp => !_.isNil(vp.valueType) &&
      !validValueTypeInputs.includes(vp.valueType))) {
      throw AppError.badRequest('One or more value properties have an invalid "valueType". "valueType" must be one of: "exact", "placeholder", "noTreatment".', undefined, '1CC004')
    }
  }

  @setErrorCode('1CD000')
  populateIsPlaceholderFromValueType = (valueProperties) => {
    valueProperties.forEach((property) => {
      if (_.isNil(property.isPlaceholder)) {
        property.isPlaceholder = this.isValueTypePlaceholder(property)
      }
    })
  }

  @setErrorCode('1CE000')
  isValueTypePlaceholder = property => property.valueType === factorLevelValueConstants.PLACEHOLDER

  @setErrorCode('1CF000')
  areValueTypeAndPlaceholderMismatched = vp =>
    this.isValueTypePlaceholder(vp) !== vp.isPlaceholder
}

module.exports = FactorLevelService
