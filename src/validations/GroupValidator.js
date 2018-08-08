import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

// Error Codes 3BXXXX
class GroupValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('3B')
  }

  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      { paramName: 'parentId', type: 'numeric', required: false },
      { paramName: 'parentId', type: 'refData', entity: db.group },
      { paramName: 'refRandomizationStrategyId', type: 'numeric' },
      { paramName: 'refGroupTypeId', type: 'numeric', required: true },
      { paramName: 'refGroupTypeId', type: 'refData', entity: db.groupType },
    ]
  }

  static get PATCH_VALIDATION_SCHEMA() {
    return [
      { paramName: 'setId', type: 'numeric', required: true },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.group },
    ]
  }

  getEntityName = () => 'Group'

  @setErrorCode('3B1000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return GroupValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return GroupValidator.POST_VALIDATION_SCHEMA.concat(
          GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      case 'PATCH':
        return GroupValidator.PATCH_VALIDATION_SCHEMA
          .concat(GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS)
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('3B1001'))
    }
  }

  @setErrorCode('3B2000')
  preValidate = (groupObj) => {
    if (!_.isArray(groupObj) || groupObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Group request object needs to be an array', undefined, getFullErrorCode('3B2001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('3B3000')
  postValidate = () => Promise.resolve()
}

module.exports = GroupValidator
