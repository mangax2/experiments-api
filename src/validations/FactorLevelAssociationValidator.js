import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

// Error Codes 37XXXX
class FactorLevelAssociationValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('37')
  }

  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'associatedLevelId', type: 'numeric', required: true },
      { paramName: 'associatedLevelId', type: 'refData', entity: db.factorLevel },
      { paramName: 'nestedLevelId', type: 'numeric', required: true },
      { paramName: 'nestedLevelId', type: 'refData', entity: db.factorLevel },
      {
        paramName: 'FactorLevelAssociation',
        type: 'businessKey',
        keys: ['associatedLevelId', 'nestedLevelId'],
        entity: db.factorLevelAssociation,
      },
    ]
  }

  @setErrorCode('371000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return FactorLevelAssociationValidator.POST_VALIDATION_SCHEMA
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('371001'))
    }
  }

  getBusinessKeyPropertyNames = () => ['associatedLevelId', 'nestedLevelId']

  getDuplicateBusinessKeyError = () => 'Duplicate association in request payload'

  getEntityName = () => 'FactorLevelAssociation'

  @setErrorCode('372000')
  preValidate = (factorLevelAssociationObj) => {
    if (!_.isArray(factorLevelAssociationObj) || factorLevelAssociationObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('FactorLevelAssociation request object needs to be an array', undefined, getFullErrorCode('372001')))
    }
    return Promise.resolve()
  }
}

module.exports = FactorLevelAssociationValidator
