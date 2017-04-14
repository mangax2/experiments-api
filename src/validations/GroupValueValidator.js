import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class GroupValueValidator extends SchemaValidator {
  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: false },
      { paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: false },
      { paramName: 'groupId', type: 'numeric', required: true },
      { paramName: 'groupId', type: 'refData', entity: db.group },
      {
        paramName: 'GroupValue',
        type: 'businessKey',
        keys: ['groupId', 'name'],
        entity: db.groupValue,
      },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.groupValue },
    ]
  }

  getEntityName = () => 'GroupValue'

  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return GroupValueValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return GroupValueValidator.POST_VALIDATION_SCHEMA.concat(
          GroupValueValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        return GroupValueValidator.POST_VALIDATION_SCHEMA.concat(
          GroupValueValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
    }
  }

  getBusinessKeyPropertyNames = () => ['groupId', 'name']

  getDuplicateBusinessKeyError = () => 'Duplicate name and value in request payload with same groupId'

  preValidate = (groupValueObj) => {
    if (!_.isArray(groupValueObj) || groupValueObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Group Value request object needs to be an array'))
    }
    if (_.filter(groupValueObj, (gv) => {
      if (!gv.name || !gv.value) {
        return gv
      }
      return undefined
    }).length > 0) {
      return Promise.reject(
        AppError.badRequest('Group Values must have a name and a value'),
      )
    }

    return Promise.resolve()
  }

  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(targetObject, obj => _.pick(obj, businessKeyPropertyNames))
      const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj => keyObj.groupId))
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

module.exports = GroupValueValidator
