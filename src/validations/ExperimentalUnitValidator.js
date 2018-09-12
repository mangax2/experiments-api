import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

// Error Codes 34XXXX
class ExperimentalUnitValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('34')
  }

  static get POST_VALIDATION_SCHEMA() {
    return [
      {
        paramName: 'rep', type: 'numeric', numericRange: { min: 1, max: 999 }, required: true,
      },
      { paramName: 'groupId', type: 'numeric' },
      { paramName: 'treatmentId', type: 'numeric', required: true },
      { paramName: 'treatmentId', type: 'refData', entity: db.treatment },
      { paramName: 'setEntryId', type: 'numeric' },
      { paramName: 'location', type: 'numeric' },
    ]
  }

  static get PATCH_VALIDATION_SCHEMA() {
    return [
      { paramName: 'setEntryId', type: 'numeric', required: true },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.unit },
    ]
  }

  getEntityName = () => 'ExperimentalUnit'

  @setErrorCode('341000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return ExperimentalUnitValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return ExperimentalUnitValidator.POST_VALIDATION_SCHEMA.concat(
          ExperimentalUnitValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      case 'PATCH':
        return ExperimentalUnitValidator.PATCH_VALIDATION_SCHEMA.concat(
          ExperimentalUnitValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('341001'))
    }
  }

  @setErrorCode('342000')
  preValidate = (combinationElementObj) => {
    if (!_.isArray(combinationElementObj) || combinationElementObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('ExperimentalUnit request object needs to be an array', undefined, getFullErrorCode('342001')))
    }
    return Promise.resolve()
  }

  postValidate = () =>
  // No business key to validate
    Promise.resolve()
}

module.exports = ExperimentalUnitValidator
