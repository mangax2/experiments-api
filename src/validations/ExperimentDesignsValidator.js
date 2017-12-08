import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class ExperimentDesignsValidator extends SchemaValidator {
  getSchema = () => [
    {
      paramName: 'name', type: 'text', lengthRange: { min: 1, max: 50 }, required: true,
    },
    {
      paramName: 'ExperimentDesign',
      type: 'businessKey',
      keys: ['name'],
      entity: db.experimentDesign,
    },
  ]

  getEntityName = () => 'ExperimentDesign'

  preValidate = (designObj) => {
    if (!_.isArray(designObj) || designObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Experiment Designs request object needs to be an array'))
    }
    return Promise.resolve()
  }

  postValidate = () => Promise.resolve()
}

module.exports = ExperimentDesignsValidator
