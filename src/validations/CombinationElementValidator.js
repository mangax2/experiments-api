import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import { dbRead } from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 31XXXX
class CombinationElementValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('31')
  }

  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'factorLevelId', type: 'numeric', required: true },
      { paramName: 'factorLevelId', type: 'refData', entity: dbRead.factorLevel },
      { paramName: 'treatmentId', type: 'numeric', required: true },
      { paramName: 'treatmentId', type: 'refData', entity: dbRead.treatment },
      {
        paramName: 'CombinationElement',
        type: 'businessKey',
        keys: ['treatmentId', 'factorLevelId'],
        entity: dbRead.combinationElement,
      },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: dbRead.combinationElement },
    ]
  }

  getEntityName = () => 'CombinationElement'

  @setErrorCode('311000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return CombinationElementValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return CombinationElementValidator.POST_VALIDATION_SCHEMA.concat(
          CombinationElementValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('311001'))
    }
  }

  getBusinessKeyPropertyNames = () => ['treatmentId', 'factorLevelId']

  getDuplicateBusinessKeyError = () => ({ message: 'Duplicate FactorLevel in request payload with same treatmentId', errorCode: getFullErrorCode('314001') })

  @setErrorCode('312000')
  preValidate = (combinationElementObj) => {
    if (!_.isArray(combinationElementObj) || combinationElementObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('CombinationElement request object needs to be an array', undefined, getFullErrorCode('312001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('313000')
  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(targetObject, obj => _.pick(obj, businessKeyPropertyNames))
      const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj => keyObj.treatmentId))
      _.forEach(groupByObject, (innerArray) => {
        const names = _.map(innerArray, e => e[businessKeyPropertyNames[1]])
        if (_.uniq(names).length !== names.length) {
          this.messages.push(this.getDuplicateBusinessKeyError())
          return false
        }
        return true
      })
    }
    return Promise.resolve()
  }
}

module.exports = CombinationElementValidator
