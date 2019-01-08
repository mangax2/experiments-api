import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 36XXXX
class ExperimentsValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('36')
  }

  static get POST_AND_PUT_SCHEMA_ELEMENTS() {
    return [
      {
        paramName: 'name', type: 'text', lengthRange: { min: 1, max: 100 }, required: true,
      },
      {
        paramName: 'description',
        type: 'text',
        lengthRange: { min: 0, max: 5000 },
        required: false,
      },
      { paramName: 'refExperimentDesignId', type: 'refData', entity: db.experimentDesign },
      { paramName: 'status', type: 'constant', data: ['DRAFT', 'ACTIVE', 'SUBMITTED', 'APPROVED', 'REJECTED'] },
      { paramName: 'is_template', type: 'boolean' },
      { paramName: 'randomizationStrategyCode', type: 'text', lengthRange: { min: 1, max: 1000 } },
    ]
  }

  static get FILTER_SCHEMA_ELEMENTS() {
    return [
      {
        paramName: 'tags.category',
        type: 'text',
        lengthRange: { min: 1, max: 1000 },
        required: false,
      },
      {
        paramName: 'tags.value',
        type: 'text',
        lengthRange: { min: 1, max: 1000 },
        required: false,
      },
    ]
  }

  @setErrorCode('361000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
      case 'PUT':
        return ExperimentsValidator.POST_AND_PUT_SCHEMA_ELEMENTS
      case 'FILTER':
        return ExperimentsValidator.FILTER_SCHEMA_ELEMENTS
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('361001'))
    }
  }

  getEntityName = () => 'Experiment'

  @setErrorCode('362000')
  preValidate = (experimentObj) => {
    if (!_.isArray(experimentObj) || experimentObj.length === 0) {
      const entity = experimentObj && experimentObj.isTemplate ? 'Templates' : 'Experiments'
      return Promise.reject(
        AppError.badRequest(`${entity} request object needs to be an array`, undefined, getFullErrorCode('362001')))
    }
    return Promise.resolve()
  }

  postValidate = () => Promise.resolve()
}

module.exports = ExperimentsValidator
