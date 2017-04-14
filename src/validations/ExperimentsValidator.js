import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class ExperimentsValidator extends SchemaValidator {

  static get POST_AND_PUT_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'name', type: 'text', lengthRange: { min: 1, max: 100 }, required: true },
      {
        paramName: 'description',
        type: 'text',
        lengthRange: { min: 0, max: 5000 },
        required: false,
      },
      { paramName: 'refExperimentDesignId', type: 'refData', entity: db.experimentDesign },
      { paramName: 'status', type: 'constant', data: ['DRAFT', 'ACTIVE'], required: true },
    ]
  }

  static get FILTER_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'tags.name', type: 'text', lengthRange: { min: 1, max: 1000 }, required: false },
      {
        paramName: 'tags.value',
        type: 'text',
        lengthRange: { min: 1, max: 1000 },
        required: false,
      },
    ]
  }

  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
      case 'PUT':
        return ExperimentsValidator.POST_AND_PUT_SCHEMA_ELEMENTS
      case 'FILTER':
        return ExperimentsValidator.FILTER_SCHEMA_ELEMENTS
      default:
        return ExperimentsValidator.POST_AND_PUT_SCHEMA_ELEMENTS
    }
  }

  getEntityName = () => 'Experiment'

  preValidate = (factorObj) => {
    console.log("experiment prevalidate")
    if (!_.isArray(factorObj) || factorObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Experiments request object needs to be an array'))
    }
    return Promise.resolve()
  }

  postValidate = () => {
    console.log("EV post")
    return Promise.resolve()
  }
}

module.exports = ExperimentsValidator
