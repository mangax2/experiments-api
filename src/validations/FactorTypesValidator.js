import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class FactorTypesValidator extends SchemaValidator {
  getSchema() {
    return [
      { paramName: 'type', type: 'text', lengthRange: { min: 1, max: 50 }, required: true },
      { paramName: 'FactorType', type: 'businessKey', keys: ['type'], entity: db.factorType },
    ]
  }

  getEntityName() {
    return 'FactorType'
  }

  preValidate(factorObj) {
    if (!_.isArray(factorObj) || factorObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Factor Types request object needs to be an array'))
    }
    return Promise.resolve()
  }

  postValidate(targetObject) {
    // No business key to validate
    return Promise.resolve()
  }
}

module.exports = FactorTypesValidator
