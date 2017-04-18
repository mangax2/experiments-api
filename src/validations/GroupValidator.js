import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class GroupValidator extends SchemaValidator {
  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      { paramName: 'parentId', type: 'numeric', required: false },
      { paramName: 'parentId', type: 'refData', entity: db.group },
      { paramName: 'refRandomizationStrategyId', type: 'numeric', required: true },
      { paramName: 'refGroupTypeId', type: 'numeric', required: true },
      { paramName: 'refGroupTypeId', type: 'refData', entity: db.groupType },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.group },
    ]
  }

  getEntityName = () => 'Group'

  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return GroupValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return GroupValidator.POST_VALIDATION_SCHEMA.concat(
          GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation')
    }
  }

  preValidate = (groupObj) => {
    if (!_.isArray(groupObj) || groupObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Group request object needs to be an array'))
    }
    return Promise.resolve()
  }

  postValidate = () => Promise.resolve()
}

module.exports = GroupValidator
