import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import { dbRead } from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

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
      { paramName: 'treatmentId', type: 'refData', entity: dbRead.treatment },
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
      { paramName: 'id', type: 'refData', entity: dbRead.unit },
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
  preValidate = (unitsObj) => {
    if (!_.isArray(unitsObj) || unitsObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('ExperimentalUnit request object needs to be an array', undefined, getFullErrorCode('342001')))
    }

    const numberOfUnitsWithBlockNumber = _.compact(_.map(unitsObj, 'block')).length
    if (numberOfUnitsWithBlockNumber !== 0 && numberOfUnitsWithBlockNumber !== unitsObj.length) {
      return Promise.reject(AppError.badRequest('Either all experimental units must have a block or no experimental units can have a block.', undefined, getFullErrorCode('342002')))
    }
    return Promise.resolve()
  }

  postValidate = () =>
  // No business key to validate
    Promise.resolve()
}

module.exports = ExperimentalUnitValidator
