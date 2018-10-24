import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 3EXXXX
class TagValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('3E')
  }

  static get VALIDATION_SCHEMA() {
    return [
      {
        paramName: 'category', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
      },
      {
        paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
      },
      { paramName: 'experimentId', type: 'numeric', required: true },
    ]
  }

  getSchema = () => TagValidator.VALIDATION_SCHEMA

  getEntityName = () => 'Tag'

  getBusinessKeyPropertyNames = () => ['category', 'value', 'experimentId']

  getDuplicateBusinessKeyError = () => ({ message: 'Duplicate Tag in request payload with same experiment id', errorCode: getFullErrorCode('3E4001') })

  @setErrorCode('3E2000')
  preValidate = (obj) => {
    if (!_.isArray(obj) || obj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Tag request object needs to be an array', undefined, getFullErrorCode('3E2001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('3E3000')
  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(targetObject, obj => _.pick(obj, businessKeyPropertyNames))
      const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj => keyObj.experimentId))
      _.forEach(groupByObject, (innerArray) => {
        const categoriesAndValues = _.map(innerArray, e => ({
          category: e[businessKeyPropertyNames[0]],
          value: e[businessKeyPropertyNames[1]],
        }))
        if (_.uniqWith(categoriesAndValues, _.isEqual).length !== categoriesAndValues.length) {
          this.messages.push(this.getDuplicateBusinessKeyError())
          return false
        }
        return true
      })
    }
    return Promise.resolve()
  }
}

module.exports = TagValidator
