import log4js from 'log4js'
import _ from 'lodash'
import HttpUtil from '../services/utility/HttpUtil'
import PingUtil from '../services/utility/PingUtil'
import cfServices from '../services/utility/ServiceConfig'
import AppError from './utility/AppError'
import OwnerService from './OwnerService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('SecurityService')

class SecurityService {

  constructor() {
    this.ownerService = new OwnerService()
  }

  @Transactional('permissionsCheck')
  permissionsCheck(id, context, tx) {
    return this.getUserPermissionsForExperiment(id, context, tx).then((data) => {
      if (data.length === 0) {
        logger.error(`Access denied for ${context.userId} on experimentId ${id}`)
        throw AppError.unauthorized('Access denied')
      }
    })
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
    return Promise.all([this.ownerService.getOwnersByExperimentId(id, tx),
      this.getGroupsByUserId(context.userId)]).then((data) => {
        if (data[0] && data[1]) {
          const groupIdsAssignedToExperiments = data[0].group_ids
          const upperCaseUserIds = _.map(data[0].user_ids, _.toUpper)
          const userGoupIds = data[1]
          if (upperCaseUserIds.includes(context.userId) ||
          _.intersection(groupIdsAssignedToExperiments, userGoupIds).length > 0) {
            return ['write']
          }
          return []
        }
        return []
      })
  }

}

module.exports = SecurityService
