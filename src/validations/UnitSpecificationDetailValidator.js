import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 3GXXXX
class UnitSpecificationDetailValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('3G')
  }

  static get POST_VALIDATION_SCHEMA() {
    return [
      {
        paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: true,
      },
      { paramName: 'uomCode', type: 'text', required: false },
      { paramName: 'refUnitSpecId', type: 'numeric', required: true },
      { paramName: 'refUnitSpecId', type: 'refData', entity: db.unitSpecification },
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      {
        paramName: 'UnitSpecificationDetail',
        type: 'businessKey',
        keys: ['experimentId', 'refUnitSpecId'],
        entity: db.unitSpecificationDetail,
      },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.unitSpecificationDetail },
    ]
  }

  getEntityName = () => 'UnitSpecificationDetail'

  @setErrorCode('3G1000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return UnitSpecificationDetailValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return UnitSpecificationDetailValidator.POST_VALIDATION_SCHEMA.concat(
          UnitSpecificationDetailValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('3G1001'))
    }
  }

  getBusinessKeyPropertyNames = () => ['experimentId', 'refUnitSpecId']

  getDuplicateBusinessKeyError = () => ({ message: 'Duplicate unit specification id in request payload with same experiment id', errorCode: getFullErrorCode('3G4001') })

  @setErrorCode('3G2000')
  preValidate = (unitSpecificationDetailObj) => {
    if (!_.isArray(unitSpecificationDetailObj) || unitSpecificationDetailObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Unit specification detail request object needs to be an array', undefined, getFullErrorCode('3G2001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('3G3000')
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

module.exports = UnitSpecificationDetailValidator
