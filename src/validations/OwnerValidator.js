import log4js from 'log4js'
import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import HttpUtil from '../services/utility/HttpUtil'
import PingUtil from '../services/utility/PingUtil'
import cfServices from '../services/utility/ServiceConfig'

const logger = log4js.getLogger('OwnerValidator')

class OwnerValidator extends SchemaValidator {
  ownerRetrievalPromise
  userIds

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
      if (!this.ownerRetrievalPromise) {
        this.getUserIds(ownerObj[0].userIds)
      }
      return this.ownerRetrievalPromise.then(() =>
        this.validateOwnerIds(ownerObj[0], context.userId))
    }
    return Promise.resolve()
  }

  validateOwnerIds = (ownerObj, userId) => {
    if (ownerObj.userIds.length !== this.userIds.length) {
      return Promise.reject(AppError.badRequest('Some users listed are invalid'))
    }
    if (!_.includes(ownerObj.userIds, userId)) {
      return Promise.reject(AppError.badRequest('You cannot remove yourself as an owner'))
    }
    return Promise.resolve()
  }

  getUserIds = (userIds) => {
    let resolver
    let rejecter
    this.ownerRetrievalPromise = new Promise((resolve, reject) => {
      resolver = resolve
      rejecter = reject
    })
    return PingUtil.getMonsantoHeader().then(header =>
      HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.profileAPIUrl}/users?ids=${userIds.join()}`, header).then((result) => {
        if (result && result.body) {
          this.userIds = _.map(result.body, 'id')
        }
        resolver()
      }),
    ).catch((err) => {
      logger.error(`An error occurred when retrieving user ids: ${HttpUtil.getErrorMessageForLogs(err)}`)
      this.strategyRetrievalPromise = undefined
      rejecter(AppError.badRequest('Unable to retrieve user ids.'))
    })
  }
}

module.exports = OwnerValidator
