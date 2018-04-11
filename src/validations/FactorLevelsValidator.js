import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

// Error Codes 38XXXX
class FactorLevelsValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('38')
  }

  static get POST_VALIDATION_SCHEMA() {
    return [
      // { paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
      { paramName: 'factorId', type: 'numeric', required: true },
      { paramName: 'factorId', type: 'refData', entity: db.factor },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.factorLevel },
    ]
  }

  getEntityName = () => 'FactorLevel'

  @setErrorCode('381000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return FactorLevelsValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return FactorLevelsValidator.POST_VALIDATION_SCHEMA.concat(
          FactorLevelsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('381001'))
    }
  }

  getBusinessKeyPropertyNames = () => ['factorId', 'value']

  getDuplicateBusinessKeyError = () => ({ message: 'Duplicate factor level value in request payload with same factor id', errorCode: getFullErrorCode('384001') })

  @setErrorCode('382000')
  preValidate = (factorLevelObj) => {
    if (!_.isArray(factorLevelObj) || factorLevelObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Factor Level request object needs to be an array', undefined, getFullErrorCode('382001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('383000')
  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(targetObject, obj => _.pick(obj, businessKeyPropertyNames))
      const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj => keyObj.factorId))
      _.forEach(groupByObject, (innerArray) => {
        const value = _.map(innerArray, e => e[businessKeyPropertyNames[1]])
        if (_.uniqWith(value, _.isEqual).length !== value.length) {
          this.messages.push(this.getDuplicateBusinessKeyError())
          return false
        }
        return true
      })
    }
    return Promise.resolve()
  }
}

module.exports = FactorLevelsValidator
