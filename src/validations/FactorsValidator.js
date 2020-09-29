import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 39XXXX
class FactorsValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('39')
  }

  static get POST_VALIDATION_SCHEMA() {
    return [
      {
        paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
      },
      { paramName: 'tier', type: 'numeric', numericRange: { min: 1, max: 10 } },
      { paramName: 'refFactorTypeId', type: 'numeric', required: true },
      { paramName: 'refFactorTypeId', type: 'refData', entity: db.factorType },
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      { paramName: 'isBlockingFactorOnly', type: 'boolean' },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.factor },
    ]
  }

  getEntityName = () => 'Factor'

  @setErrorCode('391000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return FactorsValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return FactorsValidator.POST_VALIDATION_SCHEMA.concat(
          FactorsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('391001'))
    }
  }

  getBusinessKeyPropertyNames = () => ['experimentId', 'name']

  getDuplicateBusinessKeyError = () => ({ message: 'Duplicate factor name in request payload with same experiment id', errorCode: getFullErrorCode('394001') })

  @setErrorCode('392000')
  preValidate = (factorObj) => {
    if (!_.isArray(factorObj) || factorObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Factor request object needs to be an array', undefined, getFullErrorCode('392001')))
    }

    const factorNames = _.map(factorObj, 'name')

    if (_.uniq(factorNames).length !== factorNames.length) {
      return Promise.reject(
        AppError.badRequest('Factor names must be unique', undefined, getFullErrorCode('392002')))
    }
    return Promise.resolve()
  }

  @setErrorCode('393000')
  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(targetObject, obj => _.pick(obj, businessKeyPropertyNames))
      const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj => keyObj.experimentId))
      _.forEach(groupByObject, (innerArray) => {
        const names = _.map(innerArray, e => e[businessKeyPropertyNames[1]])
        if (_.uniq(names).length !== names.length) {
          this.messages.push(this.getDuplicateBusinessKeyError())
          return false
        }
        return true
      })
    }
    return Promise.resolve()
  }
}

module.exports = FactorsValidator
