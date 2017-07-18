import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'

class DesignSpecificationDetailValidator extends SchemaValidator {
  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'value', type: 'text', lengthRange: { min: 0, max: 50 }, required: true },
      { paramName: 'refDesignSpecId', type: 'numeric', required: true },
      { paramName: 'refDesignSpecId', type: 'refData', entity: db.refDesignSpecification },
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      {
        paramName: 'DesignSpecificationDetail',
        type: 'businessKey',
        keys: ['experimentId', 'refDesignSpecId'],
        entity: db.designSpecificationDetail,
      },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.designSpecificationDetail },
    ]
  }

  getEntityName = () => 'DesignSpecificationDetail'

  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return DesignSpecificationDetailValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return DesignSpecificationDetailValidator.POST_VALIDATION_SCHEMA.concat(
          DesignSpecificationDetailValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation')
    }
  }

  getBusinessKeyPropertyNames = () => ['experimentId', 'refDesignSpecId']

  getDuplicateBusinessKeyError = () => 'Duplicate design specification id in request payload with' +
  ' same experiment id'

  preValidate = (designSpecificationDetailObj) => {
    if (!_.isArray(designSpecificationDetailObj) || designSpecificationDetailObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Design specification detail request object needs to be an array'))
    }
    return Promise.resolve()
  }

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

module.exports = DesignSpecificationDetailValidator
