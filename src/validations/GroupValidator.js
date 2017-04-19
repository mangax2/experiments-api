import log4js from 'log4js'
import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import HttpUtil from '../services/utility/HttpUtil'
import PingUtil from '../services/utility/PingUtil'
import cfServices from '../services/utility/ServiceConfig'

const logger = log4js.getLogger('GroupValidator')

class GroupValidator extends SchemaValidator {
  strategyRetrievalPromise
  validRandomizationIds

  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      { paramName: 'parentId', type: 'numeric', required: false },
      { paramName: 'parentId', type: 'refData', entity: db.group },
      { paramName: 'refRandomizationStrategyId', type: 'numeric' },
      { paramName: 'refGroupTypeId', type: 'numeric', required: true },
      { paramName: 'refGroupTypeId', type: 'refData', entity: db.groupType },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.group },
    ]
  }

  getEntityName = () => 'Group'

  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return GroupValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return GroupValidator.POST_VALIDATION_SCHEMA.concat(
          GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      default:
        throw AppError.badRequest('Invalid Operation')
    }
  }

  preValidate = (groupObj) => {
    if (!_.isArray(groupObj) || groupObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Group request object needs to be an array'))
    }
    return Promise.resolve()
  }

  postValidate = (groupObj) => {
    if (!this.strategyRetrievalPromise) {
      this.getValidRandomizationIds()
    }
    return this.strategyRetrievalPromise.then(() =>
      this.validateRandomizationStrategyIds(groupObj))
  }

  validateRandomizationStrategyIds = (groupObj) => {
    const uniqueRandomizationIds = _.uniq(_.filter(_.map(groupObj, 'refRandomizationStrategyId')))
    const invalidRandomizationIds = _.difference(uniqueRandomizationIds,
      this.validRandomizationIds)

    if (invalidRandomizationIds.length > 0) {
      return Promise.reject(AppError.badRequest(`Invalid randomization strategy ids: ${invalidRandomizationIds.join(', ')}`))
    }
    return Promise.resolve()
  }

  getValidRandomizationIds = () => {
    let resolver
    let rejecter
    this.strategyRetrievalPromise = new Promise((resolve, reject) => {
      resolver = resolve
      rejecter = reject
    })
    return PingUtil.getMonsantoHeader().then(header =>
      HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.randomizationAPIUrl}/strategies`, header).then((result) => {
        if (result && result.body) {
          this.validRandomizationIds = _.map(result.body, 'id')
        }
        resolver()
      })).catch((err) => {
        logger.error(`An error occurred when retrieving randomization strategies: ${HttpUtil.getErrorMessageForLogs(err)}`)
        this.strategyRetrievalPromise = undefined
        rejecter(AppError.badRequest('Unable to validate randomization strategy ids.'))
      })
  }
}

module.exports = GroupValidator
