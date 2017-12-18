import * as _ from 'lodash'
import log4js from 'log4js'
import validator from 'validator'
import AppError from '../services/utility/AppError'
import ReferentialIntegrityService from '../services/ReferentialIntegrityService'

const logger = log4js.getLogger('BaseValidator')

class BaseValidator {
  constructor() {
    this.messages = []
    this.referentialIntegrityService = new ReferentialIntegrityService()
  }

  hasErrors() {
    return this.messages.length > 0
  }

  validateArray(objectArray, operationName, optionalTransaction) {
    return Promise.all(
      _.map(objectArray, element =>
        this.validateEntity(element, operationName, optionalTransaction),
      )).then(() => {
        if (!this.hasErrors()) {
          return this.validateBatchForRI(objectArray, operationName, optionalTransaction)
        }
        return Promise.resolve()
      })
  }

  validateArrayOrSingleEntity(targetObject, operationName, optionalTransaction) {
    return _.isArray(targetObject)
      ? this.validateArray(targetObject, operationName, optionalTransaction)
      : this.validateEntity(targetObject, operationName, optionalTransaction)
  }

  validate(targetObject, operationName, optionalTransaction, context) {
    return this.preValidate(targetObject)
      .then(() => this.validateArrayOrSingleEntity(targetObject, operationName, optionalTransaction)
        .then(() => this.postValidate(targetObject, context, optionalTransaction))
        .then(() => this.check()))
  }

  preValidate = () => Promise.resolve()

  postValidate = () => Promise.resolve()

  validateEntity = (targetObject) => {
    logger.error(`validateEntity validation method not implemented to validate ${targetObject}`)
    return Promise.reject(AppError.internalServerError('Server error, please contact support'))
  }

  validateBatchForRI = () => {
    logger.error('validateBatchForRI validation method not implemented to validate')
    return Promise.reject(AppError.internalServerError('Server error, please contact support'))
  }

  checkLength(value, lengthRange, name) {
    if (typeof value !== 'string') {
      this.messages.push(`${name} must be a string`)
    } else if (!validator.isLength(value, lengthRange.min, lengthRange.max)) {
      this.messages.push(`${name} length is out of range(min=${lengthRange.min} max=${lengthRange.max})`)
    }
  }

  literalCheck(value, name, type) {
    if (_.isObject(value) && type !== 'array') {
      this.messages.push(`${name} must be a literal value. Object and Arrays are not supported.`)
      return false
    }
    return true
  }

  checkRequired(value, name) {
    if (value === undefined || value === null || validator.isEmpty(value.toString())) {
      this.messages.push(`${name} is required`)
    }
  }

  checkNumeric(value, name) {
    if (!_.isFinite(value)) {
      this.messages.push(`${name} must be numeric`)
    }
  }

  checkNumericRange(value, numericRange, name) {
    if (value < numericRange.min || value > numericRange.max) {
      this.messages.push(`${name} value is out of numeric range(min=${numericRange.min} max=${numericRange.max})`)
    }
  }

  checkConstants(value, data, name) {
    if (data.indexOf(value) === -1) {
      this.messages.push(`${name} requires a valid value`)
    }
  }

  checkBoolean(value, name) {
    if (!validator.isBoolean(value.toString())) {
      this.messages.push(`${name} must be a boolean`)
    }
  }

  checkReferentialIntegrityById(id, entity, optionalTransaction) {
    return this.referentialIntegrityService.getById(id, entity, optionalTransaction)
      .then((data) => {
        if (!data) {
          this.messages.push(`${this.getEntityName()} not found for id ${id}`)
        }
      })
  }

  checkRIBatch(riBatchOfGroups, optionalTransaction) {
    return Promise.all(
      _.map(riBatchOfGroups, groupSet =>
        // Note: It is assumed that all elements in the group set are either referential integrity
        // checks, or business key uniqueness checks
        this.getPromiseForRIorBusinessKeyCheck(groupSet, optionalTransaction)),
    )
  }

  checkArray(value, name, entityCount) {
    if (value.length < entityCount.min || value.length > entityCount.max) {
      this.messages.push(`${name} is out of item count range(min=${entityCount.min} max=${entityCount.max}`)
    }
  }

  getPromiseForRIorBusinessKeyCheck(groupSet, optionalTransaction) {
    if (groupSet.length === 0) {
      return Promise.resolve()
    }

    const { entity } = groupSet[0]
    const ids = this.getDistinctIds(groupSet)
    if (ids.length > 0) {
      // Note: ids list is assumed to have no duplicates before calling this function
      return this.verifyIdsExist(ids, groupSet, entity, optionalTransaction)
    }
    return this.verifyBusinessKeysAreUnique(groupSet, entity, optionalTransaction)
  }

  getDistinctIds = groupSet =>
    _.chain(groupSet).map(g => g.id).filter((e => e !== undefined && e !== null)).uniq()
      .value()

  verifyIdsExist(ids, groupSet, entity, optionalTransaction) {
    // Note: ids list is assumed to have no duplicates before calling this function
    return this.referentialIntegrityService.getEntitiesByIds(ids, entity, optionalTransaction)
      .then((data) => {
        if (data.length !== ids.length) {
          this.messages.push(`${this.getEntityName()} not found for ${groupSet[0].paramName}(s): ${this.getIdDifference(ids, data)}`)
        }
      })
  }

  extractBusinessKeys = groupSet => _.map(groupSet, r => ({ keys: r.keys, updateId: r.updateId }))

  verifyBusinessKeysAreUnique(groupSet, entity, optionalTransaction) {
    const businessKeyObjects = this.extractBusinessKeys(groupSet)
    return this.referentialIntegrityService.getEntitiesByKeys(
      businessKeyObjects,
      entity,
      optionalTransaction).then((data) => {
        if (data && data.length > 0) {
          this.messages.push(`${this.getEntityName()} already exists for business keys ${this.formatBusinessKey(data)}`)
        }
      })
  }

  getIdDifference = (ids, data) => {
    const idsFromDb = _.map(data, d => d.id)
    return _.difference(ids, idsFromDb)
  }

  formatBusinessKey = (dataFromDb) => {
    const result = _.map(dataFromDb, d => JSON.stringify(d).replace(/"/g, ''))
    return result.join()
  }

  getEntityName = () => {
    throw new Error('entityName not implemented')
  }

  check() {
    if (this.messages.length > 0) {
      const copyMessages = this.messages
      this.messages = []
      return Promise.reject(
        _.map(copyMessages, x => AppError.badRequest(x)),
      )
    }
    return Promise.resolve()
  }
}

module.exports = BaseValidator
