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
        entityCount: { min: 0 },
        required: false,
      },
      {
        paramName: 'groupIds',
        type: 'array',
        entityCount: { min: 0 },
        required: false,
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
      return this.additionalCheck(ownerObj[0])
        .then(() => this.validateUserIds(ownerObj[0].userIds)
          .then(() => this.validateGroupIds(ownerObj[0].groupIds)
            .then(() => {
              const groupIds = ownerObj[0].groupIds ? ownerObj[0].groupIds : []
              const userIds = ownerObj[0].userIds ? ownerObj[0].userIds : []
              return this.userOwnershipCheck(groupIds, userIds, context.userId)
            })))
    }
    return Promise.resolve()
  }

  additionalCheck = (ownerObj) => {
    const userIds = _.compact(ownerObj.userIds)
    const groupIds = _.compact(ownerObj.groupIds)
    if (userIds.length === 0 && groupIds.length === 0) {
      return Promise.reject(
        AppError.badRequest('Owner is required in request'),
      )
    }
    return Promise.resolve()
  }


  validateUserIds = (userIds) => {
    if (!userIds && userIds.length === 0) {
      return Promise.resolve()
    }
    return PingUtil.getMonsantoHeader()
    .then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.profileAPIUrl}/users?ids=${userIds.join()}`, header)
      .then((result) => {
        const profileIds = _.map(result.body, 'id')
        const invalidUsers = _.difference(userIds, profileIds)

        if (userIds.length !== profileIds.length) {
          return Promise.reject(AppError.badRequest(`Some users listed are invalid: ${invalidUsers}`))
        }

        return Promise.resolve()
      }),
    )
  }


  validateGroupIds = (groupIds) => {
    if (!groupIds || groupIds.length === 0) {
      return Promise.resolve()
    }
    return PingUtil.getMonsantoHeader()
    .then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.profileAPIUrl}/groups?ids=${groupIds.join()}`, header)
      .then((result) => {
        const profileIds = _.map(result.body.groups, 'id')
        const invalidGroups = _.difference(groupIds, profileIds)

        if (groupIds.length !== profileIds.length) {
          return Promise.reject(AppError.badRequest(`Some groups listed are invalid: ${invalidGroups}`))
        }

        return Promise.resolve()
      }),
    )
  }


  userOwnershipCheck = (groupIds, userIds, userId) => {
    if (_.includes(userIds, userId)) {
      return Promise.resolve()
    }
    if (groupIds.length === 0) {
      return Promise.reject(AppError.badRequest('You cannot remove yourself as an owner'))
    }

    return PingUtil.getMonsantoHeader()
        .then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.profileAPIUrl}/users/${userId}/groups`, header)
          .then((result) => {
            const profileGroupIds = _.map(result.body.groups, 'id')

            if (_.intersection(groupIds, profileGroupIds).length === 0) {
              return Promise.reject(AppError.badRequest('You cannot remove yourself as an owner'))
            }

            return Promise.resolve()
          }))
  }
}

module.exports = OwnerValidator
