import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import { dbRead } from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 3AXXXX
class FactorTypesValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('3A')
  }

  @setErrorCode('3A1000')
  getSchema = () => [
    {
      paramName: 'type', type: 'text', lengthRange: { min: 1, max: 50 }, required: true,
    },
    {
      paramName: 'FactorType', type: 'businessKey', keys: ['type'], entity: dbRead.factorType,
    },
  ]

  getEntityName = () => 'FactorType'

  @setErrorCode('3A2000')
  preValidate = (factorObj) => {
    if (!_.isArray(factorObj) || factorObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Factor Types request object needs to be an array', undefined, getFullErrorCode('3A2001')))
    }
    return Promise.resolve()
  }

  postValidate = () => Promise.resolve()
}

module.exports = FactorTypesValidator
