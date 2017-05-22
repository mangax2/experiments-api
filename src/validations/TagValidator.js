import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'

class TagValidator extends SchemaValidator {
  static get VALIDATION_SCHEMA() {
    return [
      { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
      { paramName: 'value', type: 'text', lengthRange: { min: 1, max: 500 }, required: true },
      { paramName: 'experimentId', type: 'numeric', required: true },
    ]
  }

  getSchema = () => TagValidator.VALIDATION_SCHEMA

  getEntityName = () => 'Tag'


  getBusinessKeyPropertyNames = () => ['name', 'value', 'experimentId']

  getDuplicateBusinessKeyError = () => 'Duplicate Tag in request payload with same experiment id'

  preValidate = (obj) => {
    if (!_.isArray(obj) || obj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Tag request object needs to be an array'))
    }
    return Promise.resolve()
  }

  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(targetObject, obj => _.pick(obj, businessKeyPropertyNames))
      const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj => keyObj.experimentId))
      _.forEach(groupByObject, (innerArray) => {
        const namesAndValues = _.map(innerArray, e => ({
          name: e[businessKeyPropertyNames[0]],
          value: e[businessKeyPropertyNames[1]],
        }))
        if (_.uniqWith(namesAndValues, _.isEqual).length !== namesAndValues.length) {
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
