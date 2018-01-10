import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

// Error Codes 35XXXX
class ExperimentDesignsValidator extends SchemaValidator {
  @setErrorCode('351000')
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

  @setErrorCode('352000')
  preValidate = (designObj) => {
    if (!_.isArray(designObj) || designObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Experiment Designs request object needs to be an array', undefined, getFullErrorCode('352001')))
    }
    return Promise.resolve()
  }

  postValidate = () => Promise.resolve()
}

module.exports = ExperimentDesignsValidator
