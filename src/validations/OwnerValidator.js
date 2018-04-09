import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import HttpUtil from '../services/utility/HttpUtil'
import PingUtil from '../services/utility/PingUtil'
import cfServices from '../services/utility/ServiceConfig'
import config from '../../config'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()


function getPAPIResult(graphqlQuery, errorCode) {
  return PingUtil.getMonsantoHeader().then(header =>
    HttpUtil.post(`${cfServices.experimentsExternalAPIUrls.value.profileAPIUrl}/graphql`, header, { query: graphqlQuery })
      .then((result) => {
        const errors = _.get(result, 'body.errors')
        if (errors && errors.length > 0) {
          return Promise.reject(AppError.badRequest('Profile API encountered an error', errors, getFullErrorCode(errorCode)))
        }

        return Promise.resolve(result)
      }))
}

// Error Codes 3DXXXX
class OwnerValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('3D')
  }

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

  @setErrorCode('3D1000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return OwnerValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return OwnerValidator.POST_VALIDATION_SCHEMA.concat(
          OwnerValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('3D1001'))
    }
  }

  @setErrorCode('3D2000')
  preValidate = (ownerObj) => {
    if (!_.isArray(ownerObj) || ownerObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Owner request object needs to be a populated array', undefined, getFullErrorCode('3D2001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('3D3000')
  postValidate = (ownerObj, context) => {
    if (!this.hasErrors()) {
      const groupIds = _.compact(ownerObj[0].groupIds)
      const userIds = _.compact(ownerObj[0].userIds)
      return this.requiredOwnerCheck(groupIds, userIds)
        .then(() => this.validateUserIds(userIds)
          .then(() => this.validateGroupIds(groupIds)
            .then(() => this.userOwnershipCheck(groupIds, userIds, context.userId))))
    }
    return Promise.resolve()
  }

  @setErrorCode('3D4000')
  requiredOwnerCheck = (groupIds, userIds) => {
    if (userIds.length === 0 && groupIds.length === 0) {
      return Promise.reject(
        AppError.badRequest('Owner is required in request', undefined, getFullErrorCode('3D4001')),
      )
    }
    return Promise.resolve()
  }

  @setErrorCode('3D5000')
  validateUserIds = (userIds) => {
    if (userIds.length === 0) {
      return Promise.resolve()
    }

    const graphqlQuery = `{ getUsersById(ids: ${JSON.stringify(userIds)}){ id } }`

    return getPAPIResult(graphqlQuery, '3D5002').then((result) => {
      const profileIds = _.compact(_.map(result.body.data.getUsersById, 'id'))
      const invalidUsers = _.difference(userIds, profileIds)

      if (userIds.length !== profileIds.length) {
        return Promise.reject(AppError.badRequest(`Some users listed are invalid: ${invalidUsers}`, undefined, getFullErrorCode('3D5001')))
      }

      return Promise.resolve()
    })
  }

  @setErrorCode('3D6000')
  validateGroupIds = (groupIds) => {
    if (groupIds.length === 0) {
      return Promise.resolve()
    }

    const graphqlQuery = `{ getGroupsById(ids:${JSON.stringify(groupIds)}){ id } }`

    return getPAPIResult(graphqlQuery, '3D6002').then((result) => {
      const profileIds = _.compact(_.map(result.body.data.getGroupsById, 'id'))
      const invalidGroups = _.difference(groupIds, profileIds)

      if (groupIds.length !== profileIds.length) {
        return Promise.reject(AppError.badRequest(`Some groups listed are invalid: ${invalidGroups}`, undefined, getFullErrorCode('3D6001')))
      }

      return Promise.resolve()
    })
  }

  @setErrorCode('3D7000')
  userOwnershipCheck = (groupIds, userIds, userId) => {
    if (_.includes(userIds, userId)) {
      return Promise.resolve()
    }

    const graphqlQuery = `{ getUserById(id:${JSON.stringify(userId)}){ id, groups{ id } }}`

    return getPAPIResult(graphqlQuery, '3D7002').then((result) => {
      const profileGroupIds = _.compact(_.map(result.body.data.getUserById.groups, 'id'))
      const errorMessage = 'You cannot remove yourself as an owner'

      const concatGroups = _.concat(groupIds, config.admin_group)

      if (_.intersection(concatGroups, profileGroupIds).length === 0) {
        return Promise.reject(AppError.badRequest(errorMessage, undefined, getFullErrorCode('3D7001')))
      }

      return Promise.resolve()
    })
  }
}

module.exports = OwnerValidator
