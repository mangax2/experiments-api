import log4js from 'log4js'
import _ from 'lodash'
import config from '../../config'
import HttpUtil from '../services/utility/HttpUtil'
import PingUtil from '../services/utility/PingUtil'
import cfServices from '../services/utility/ServiceConfig'
import AppError from './utility/AppError'
import OwnerService from './OwnerService'
import db from '../db/DbManager'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('SecurityService')

class SecurityService {
  constructor() {
    this.ownerService = new OwnerService()
  }

  @Transactional('permissionsCheck')
  permissionsCheck(id, context, isTemplate, tx) {
    if (context.userId) {
      return db.experiments.find(id, isTemplate, tx)
        .then((data) => {
          if (!data) {
            const errorMessage = isTemplate ? 'Template Not Found for requested templateId'
              : 'Experiment Not Found for requested experimentId'
            logger.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
            throw AppError.notFound(errorMessage)
          } else {
            return this.getUserPermissionsForExperiment(id, context, tx).then((result) => {
              if (result.length === 0) {
                logger.error(`Access denied for ${context.userId} on id ${id}`)
                throw AppError.unauthorized('Access denied')
              }
              return result
            })
          }
        })
    }

    throw AppError.badRequest('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
  }

  getGroupsByUserId = userId => PingUtil.getMonsantoHeader()
    .then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.profileAPIUrl}/users/${userId}/groups`, header)
      .then((result) => {
        let groupIds = []
        if (result.body && result.body.groups) {
          groupIds = _.map(result.body.groups, 'id')
          return groupIds
        }
        return groupIds
      }))

  @Transactional('permissionsCheckForExperiments')
  permissionsCheckForExperiments(ids, context, tx) {
    return Promise.all(_.map(ids, id => this.permissionsCheck(id, context, tx)))
  }

  getUserPermissionsForExperiment(id, context, tx) {
    return Promise.all([
      this.ownerService.getOwnersByExperimentId(id, tx),
      this.getGroupsByUserId(context.userId)]).then((data) => {
        if (data[0] && data[1]) {
          const groupIdsAssignedToExperiments = _.concat(data[0].group_ids, config.admin_group)
          const upperCaseUserIds = _.map(data[0].user_ids, _.toUpper)
          const userGroupIds = data[1]
          if (upperCaseUserIds.includes(context.userId) ||
            _.intersection(groupIdsAssignedToExperiments, userGroupIds).length > 0) {
            return ['write']
          }
          return []
        }
        return []
      })
  }
}

module.exports = SecurityService
