import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import config from '../../config'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import cfServices from './utility/ServiceConfig'
import AppError from './utility/AppError'
import OwnerService from './OwnerService'
import db from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('SecurityService')

// Error Codes 1OXXXX
class SecurityService {
  constructor() {
    this.ownerService = new OwnerService()
  }

  @setErrorCode('1O1000')
  @Transactional('permissionsCheck')
  permissionsCheck(id, context, isTemplate, tx) {
    if (context.userId) {
      return db.experiments.find(id, isTemplate, tx)
        .then((data) => {
          if (!data) {
            const errorMessage = isTemplate ? 'Template Not Found for requested templateId'
              : 'Experiment Not Found for requested experimentId'
            logger.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
            throw AppError.notFound(errorMessage, undefined, getFullErrorCode('1O1001'))
          } else {
            return this.getUserPermissionsForExperiment(id, context, tx).then((result) => {
              if (result.length === 0) {
                logger.error(`Access denied for ${context.userId} on id ${id}`)
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
  getGroupsByUserId = userId => PingUtil.getMonsantoHeader()
    .then((header) => {
      const graphqlQuery = `{ getUserById(id:${JSON.stringify(userId)}){ id, groups{ id } }}`
      return HttpUtil.post(`${cfServices.experimentsExternalAPIUrls.value.profileAPIUrl}/graphql`, header, { query: graphqlQuery })
        .then((result) => {
          const graphqlResult = _.get(result, 'body')

          if (_.isNil(graphqlResult)) {
            throw AppError.badRequest('Unable to verify user permissions', getFullErrorCode('1O2001'))
          }

          if (graphqlResult.errors && graphqlResult.errors.length > 0) {
            throw AppError.badRequest('Profile API encountered an error', graphqlResult.errors, getFullErrorCode('1O2002'))
          }
          if (_.isNil(graphqlResult.data.getUserById)) {
            logger.error('Unable to verify permissions. User not found')
            return []
          }
          return _.map(graphqlResult.data.getUserById.groups, 'id')
        })
    })

  @setErrorCode('1O4000')
  getUserPermissionsForExperiment(id, context, tx) {
    const userPermissions = []
    return tx.batch([
      this.ownerService.getOwnersByExperimentId(id, tx),
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
}

module.exports = SecurityService
