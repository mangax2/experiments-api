import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class UnitSpecificationDetailValidator extends SchemaValidator {
  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'value', type: 'text', lengthRange: { min: 0, max: 500 }, required: true },
      { paramName: 'uomId', type: 'numeric', required: false },
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

  getEntityName() {
    return 'UnitSpecificationDetail'
  }

  getSchema(operationName) {
    switch (operationName) {
      case 'POST':
        return UnitSpecificationDetailValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return UnitSpecificationDetailValidator.POST_VALIDATION_SCHEMA.concat(
          UnitSpecificationDetailValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        return UnitSpecificationDetailValidator.POST_VALIDATION_SCHEMA.concat(
          UnitSpecificationDetailValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
    }
  }

  getBusinessKeyPropertyNames() {
    return ['experimentId', 'refUnitSpecId']
  }

  getDuplicateBusinessKeyError() {
    return 'Duplicate unit specification id in request payload with same experiment id'
  }

  preValidate(unitSpecificationDetailObj) {
    if (!_.isArray(unitSpecificationDetailObj) || unitSpecificationDetailObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Unit specification detail request object needs to be an array'))
    }
    return Promise.resolve()
  }

  postValidate(targetObject) {
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
      })
    }
    return Promise.resolve()
  }

}

module.exports = UnitSpecificationDetailValidator
