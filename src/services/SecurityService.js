import _ from 'lodash'
import config from '../../config'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import apiUrls from '../config/apiUrls'
import AppError from './utility/AppError'
import OwnerService from './OwnerService'
import { dbRead } from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1OXXXX
class SecurityService {
  constructor() {
    this.ownerService = new OwnerService()
  }

  @setErrorCode('1O1000')
  permissionsCheck(id, context, isTemplate) {
    if (context.userId) {
      return dbRead.experiments.find(id, isTemplate)
        .then((data) => {
          if (!data) {
            const errorMessage = isTemplate ? 'Template Not Found for requested templateId'
              : 'Experiment Not Found for requested experimentId'
            console.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
            throw AppError.notFound(errorMessage, undefined, getFullErrorCode('1O1001'))
          } else {
            return this.getUserPermissionsForExperiment(id, context).then((result) => {
              if (result.length === 0) {
                console.error(`Access denied for ${context.userId} on id ${id}`)
                throw AppError.unauthorized('Access denied', undefined, getFullErrorCode('1O1002'))
              }
              return result
            })
          }
        })
    }

    throw AppError.badRequest('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing', undefined, getFullErrorCode('1O1003'))
  }

  @setErrorCode('1O2000')
  getGroupsByUserId = userId => OAuthUtil.getAuthorizationHeaders()
    .then((header) => {
      const graphqlQuery = `{ getUserById(id:${JSON.stringify(userId)}){ id, groups{ id } }}`
      return HttpUtil.post(`${apiUrls.profileAPIUrl}/graphql`, header, { query: graphqlQuery })
        .then((result) => {
          const graphqlResult = _.get(result, 'body')

          if (_.isNil(graphqlResult)) {
            throw AppError.badRequest('Unable to verify user permissions', undefined, getFullErrorCode('1O2001'))
          }

          if (graphqlResult.errors && graphqlResult.errors.length > 0) {
            throw AppError.badRequest('Profile API encountered an error', graphqlResult.errors, getFullErrorCode('1O2002'))
          }
          if (_.isNil(graphqlResult.data.getUserById)) {
            console.error('Unable to verify permissions. User not found')
            return []
          }
          return _.map(graphqlResult.data.getUserById.groups, 'id')
        })
    })

  @setErrorCode('1O4000')
  getUserPermissionsForExperiment(id, context) {
    const userPermissions = []
    return Promise.all([
      this.ownerService.getOwnersByExperimentId(id),
      this.getGroupsByUserId(context.userId)]).then((data) => {
      if (data[0] && data[1]) {
        const groupIdsAssignedToExperiments = _.concat(data[0].group_ids, config.admin_group)
        const reviewerIdsAssignedToExperiments = _.concat(data[0].reviewer_ids, config.admin_group)
        const upperCaseUserIds = _.map(data[0].user_ids, _.toUpper)
        const userGroupIds = data[1]
        if (upperCaseUserIds.includes(context.userId) ||
            _.intersection(groupIdsAssignedToExperiments, userGroupIds).length > 0) {
          userPermissions.push('write')
        }
        if (_.intersection(reviewerIdsAssignedToExperiments, userGroupIds).length > 0) {
          userPermissions.push('review')
        }
      }
      return userPermissions
    })
  }

  @setErrorCode('1O5000')
  getEntitlementsByUserId = userId => OAuthUtil.getAuthorizationHeaders()
    .then((header) => {
      const graphqlQuery = `{ getEntitlementsForUser(userId:${JSON.stringify(userId)}, appIds:"EXPERIMENTS-UI"){code}}`
      return HttpUtil.post(`${apiUrls.profileAPIUrl}/graphql`, header, { query: graphqlQuery })
        .then((result) => {
          const graphqlResult = _.get(result, 'body')

          if (_.isNil(graphqlResult)) {
            throw AppError.badRequest('Unable to verify user entitlements', undefined, getFullErrorCode('1O5001'))
          }

          if (graphqlResult.errors && graphqlResult.errors.length > 0) {
            throw AppError.badRequest('Profile API encountered an error', graphqlResult.errors, getFullErrorCode('1O5002'))
          }
          if (_.isNil(graphqlResult.data.getEntitlementsForUser)) {
            console.error('Unable to verify permissions. User not found')
            return []
          }
          return _.map(graphqlResult.data.getEntitlementsForUser, 'code')
        })
    })

  @setErrorCode('1O6000')
  canUserCreateExperiments = (context) => {
    if (context.isApiRequest) {
      return Promise.resolve(true)
    }
    return this.getEntitlementsByUserId(context.userId)
      .then(entitlements => _.includes(entitlements, 'create'))
  }
}

module.exports = SecurityService
