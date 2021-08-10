import * as _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import { dbRead } from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 32XXXX
class DependentVariablesValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('32')
  }

  @setErrorCode('321000')
  getSchema = (operationName) => {
    const schema = [
      { paramName: 'required', type: 'boolean', required: true },
      {
        paramName: 'name', type: 'text', lengthRange: { min: 1, max: 500 }, required: true,
      },
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: dbRead.experiments },
      {
        paramName: 'DependentVariable',
        type: 'businessKey',
        keys: ['experimentId', 'name'],
        entity: dbRead.dependentVariable,
      },
    ]
    switch (operationName) {
      case 'POST':
        return schema
      case 'PUT':
        return schema.concat([{ paramName: 'id', type: 'numeric', required: true },
          { paramName: 'id', type: 'refData', entity: dbRead.dependentVariable }])
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('321001'))
    }
  }

  getEntityName = () => 'ResponseVariable'

  getBusinessKeyPropertyNames = () => ['experimentId', 'name']

  getDuplicateBusinessKeyError = () => ({ message: 'duplicate response variable name in request payload with same experiment id', errorCode: getFullErrorCode('324001') })

  @setErrorCode('322000')
  preValidate = (dependentObj) => {
    if (!_.isArray(dependentObj) || dependentObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Response Variables request object needs to be an array', undefined, getFullErrorCode('322001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('323000')
  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
      const businessKeyArray = _.map(targetObject, obj => _.pick(obj, businessKeyPropertyNames))
      const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj => keyObj.experimentId))

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

module.exports = DependentVariablesValidator
