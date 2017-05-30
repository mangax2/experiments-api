import log4js from 'log4js'
import _ from 'lodash'
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

  @Transactional('permissionsCheckForExperiments')
  permissionsCheckForExperiments(ids, context, tx) {
    return Promise.all(_.map(ids, id => this.permissionsCheck(id, context, tx)))
  }

  getUserPermissionsForExperiment(id, context, tx) {
    return this.ownerService.getOwnersByExperimentId(id, tx).then((data) => {
      if (data) {
        const upperCaseUserIds = _.map(data.user_ids, _.toUpper)
        if (upperCaseUserIds.includes(context.userId)) {
          return ['write']
        }
        return []
      }
      return []
    },
    )
  }

}

module.exports = SecurityService
