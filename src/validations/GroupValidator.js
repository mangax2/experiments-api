import log4js from 'log4js'
import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import db from '../db/DbManager'
import HttpUtil from '../services/utility/HttpUtil'
import PingUtil from '../services/utility/PingUtil'
import cfServices from '../services/utility/ServiceConfig'
import { getFullErrorCode, setErrorCode } from '../decorators/setErrorDecorator'

const logger = log4js.getLogger('GroupValidator')

// Error Codes 3BXXXX
class GroupValidator extends SchemaValidator {
  strategyRetrievalPromise
  validRandomizationIds

  static get POST_VALIDATION_SCHEMA() {
    return [
      { paramName: 'experimentId', type: 'numeric', required: true },
      { paramName: 'experimentId', type: 'refData', entity: db.experiments },
      { paramName: 'parentId', type: 'numeric', required: false },
      { paramName: 'parentId', type: 'refData', entity: db.group },
      { paramName: 'refRandomizationStrategyId', type: 'numeric', required: true },
      { paramName: 'refGroupTypeId', type: 'numeric', required: true },
      { paramName: 'refGroupTypeId', type: 'refData', entity: db.groupType },
    ]
  }

  static get PATCH_VALIDATION_SCHEMA() {
    return [
      { paramName: 'setId', type: 'numeric', required: true },
    ]
  }

  static get PUT_ADDITIONAL_SCHEMA_ELEMENTS() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: db.group },
    ]
  }

  getEntityName = () => 'Group'

  @setErrorCode('3B1000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'POST':
        return GroupValidator.POST_VALIDATION_SCHEMA
      case 'PUT':
        return GroupValidator.POST_VALIDATION_SCHEMA.concat(
          GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS,
        )
      case 'PATCH':
        return GroupValidator.PATCH_VALIDATION_SCHEMA
          .concat(GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS)
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('3B1001'))
    }
  }

  @setErrorCode('3B2000')
  preValidate = (groupObj) => {
    if (!_.isArray(groupObj) || groupObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Group request object needs to be an array', undefined, getFullErrorCode('3B2001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('3B3000')
  postValidate = (groupObj) => {
    if (!this.strategyRetrievalPromise) {
      this.getValidRandomizationIds()
    }
    return this.strategyRetrievalPromise.then(() =>
      this.validateRandomizationStrategyIds(groupObj))
  }

  @setErrorCode('3B4000')
  validateRandomizationStrategyIds = (groupObj) => {
    const uniqueRandomizationIds = _.uniq(_.filter(_.map(groupObj, 'refRandomizationStrategyId')))
    const invalidRandomizationIds = _.difference(uniqueRandomizationIds,
      this.validRandomizationIds)

    if (invalidRandomizationIds.length > 0) {
      return Promise.reject(AppError.badRequest(`Invalid randomization strategy ids: ${invalidRandomizationIds.join(', ')}`, undefined, getFullErrorCode('3B4001')))
    }
    return Promise.resolve()
  }

  @setErrorCode('3B5000')
  getValidRandomizationIds = () => {
    let resolver
    let rejecter
    this.strategyRetrievalPromise = new Promise((resolve, reject) => {
      resolver = resolve
      rejecter = reject
    })
    return PingUtil.getMonsantoHeader().then(header =>
      HttpUtil.getWithRetry(`${cfServices.experimentsExternalAPIUrls.value.randomizationAPIUrl}/strategies`, header).then((result) => {
        if (result && result.body) {
          this.validRandomizationIds = _.map(result.body, 'id')
        }
        resolver()
      }),
    ).catch((err) => {
      logger.error('An error occurred when retrieving randomization strategies', err)
      this.strategyRetrievalPromise = undefined
      rejecter(AppError.badRequest('Unable to validate randomization strategy ids.', undefined, getFullErrorCode('3B5001')))
    })
  }
}

module.exports = GroupValidator
