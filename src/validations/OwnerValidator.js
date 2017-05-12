import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import HttpUtil from '../services/utility/HttpUtil'
import PingUtil from '../services/utility/PingUtil'
import cfServices from '../services/utility/ServiceConfig'

class OwnerValidator extends SchemaValidator {

  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      {
        paramName: 'userIds',
        type: 'array',
        entityCount: { min: 1 },
        required: true,
      },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return []
  }

  getEntityName = () => 'Owner'

  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return OwnerValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return OwnerValidator.POST_VALIDATION_SCHEMA.concat(
          OwnerValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation')
    }
  }

  preValidate = (ownerObj) => {
    if (!_.isArray(ownerObj) || ownerObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Owner request object needs to be a populated array'))
    }
    return Promise.resolve()
  }

  postValidate = (ownerObj, context) => {
    if (!this.hasErrors()) {
      return this.validateUserIds(ownerObj[0].userIds, context.userId)
    }
    return Promise.resolve()
  }

  validateUserIds = (userIds, userId) => PingUtil.getMonsantoHeader()
    .then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.profileAPIUrl}/users?ids=${userIds.join()}`, header)
      .then((result) => {
        const profileIds = _.map(result.body, 'id')
        const invalidUsers = _.difference(userIds, profileIds)

        if (userIds.length !== profileIds.length) {
          return Promise.reject(AppError.badRequest(`Some users listed are invalid: ${invalidUsers}`))
        }
        if (!_.includes(profileIds, userId)) {
          return Promise.reject(AppError.badRequest('You cannot remove yourself as an owner'))
        }

        return Promise.resolve()
      }),
    )
}

module.exports = OwnerValidator
