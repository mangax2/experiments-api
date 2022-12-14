import * as _ from 'lodash'
import validator from 'validator'
import AppError from '../services/utility/AppError'
import ReferentialIntegrityService from '../services/ReferentialIntegrityService'

const { getFullErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 30XXXX
// Decorator isn't used because it would be less helpful compared to the child validator's file code
class BaseValidator {
  constructor() {
    this.messages = []
    this.referentialIntegrityService = new ReferentialIntegrityService()
  }

  setFileCode(fileCode) {
    this.fileCode = fileCode
  }

  hasErrors() {
    return this.messages.length > 0
  }

  validateArray(objectArray, operationName) {
    return Promise.all(
      _.map(objectArray, element =>
        this.validateEntity(element, operationName),
      )).then(() => {
      if (!this.hasErrors()) {
        return this.validateBatchForRI(objectArray, operationName)
      }
      return Promise.resolve()
    })
  }

  validateArrayOrSingleEntity(targetObject, operationName) {
    return _.isArray(targetObject)
      ? this.validateArray(targetObject, operationName)
      : this.validateEntity(targetObject, operationName)
  }

  validate(targetObject, operationName, context) {
    return this.preValidate(targetObject)
      .then(() => this.validateArrayOrSingleEntity(targetObject, operationName)
        .then(() => this.postValidate(targetObject, context))
        .then(() => this.check()))
  }

  preValidate = () => Promise.resolve()

  postValidate = () => Promise.resolve()

  validateEntity = (targetObject) => {
    console.error(`validateEntity validation method not implemented to validate ${targetObject}`)
    return Promise.reject(AppError.internalServerError('Server error, please contact support', undefined, getFullErrorCode('300001')))
  }

  validateBatchForRI = () => {
    console.error('validateBatchForRI validation method not implemented to validate')
    return Promise.reject(AppError.internalServerError('Server error, please contact support', undefined, getFullErrorCode('300002')))
  }

  checkLength(value, lengthRange, name) {
    if (typeof value !== 'string') {
      this.messages.push({ message: `${name} must be a string`, errorCode: getFullErrorCode(`${this.fileCode}ZZ01`) })
    } else if (!validator.isLength(value, lengthRange.min, lengthRange.max)) {
      this.messages.push({ message: `${name} length is out of range(min=${lengthRange.min} max=${lengthRange.max})`, errorCode: getFullErrorCode(`${this.fileCode}ZZ02`) })
    }
  }

  literalCheck(value, name, type) {
    if (_.isObject(value) && type !== 'array') {
      this.messages.push({ message: `${name} must be a literal value. Object and Arrays are not supported.`, errorCode: getFullErrorCode(`${this.fileCode}ZZ03`) })
      return false
    }
    return true
  }

  checkRequired(value, name) {
    if (value === undefined || value === null || validator.isEmpty(value.toString())) {
      this.messages.push({ message: `${name} is required`, errorCode: getFullErrorCode(`${this.fileCode}ZZ04`) })
    }
  }

  checkNumeric(value, name) {
    if (!_.isFinite(value)) {
      this.messages.push({ message: `${name} must be numeric`, errorCode: getFullErrorCode(`${this.fileCode}ZZ05`) })
    }
  }

  checkInteger(value, name) {
    if (!_.isInteger(value)) {
      this.messages.push({ message: `${name} must be an integer`, errorCode: getFullErrorCode(`${this.fileCode}ZZ10`) })
    }
  }

  checkNumericRange(value, numericRange, name) {
    if (value < numericRange.min || value > numericRange.max) {
      this.messages.push({ message: `${name} value is out of numeric range(min=${numericRange.min} max=${numericRange.max})`, errorCode: getFullErrorCode(`${this.fileCode}ZZ06`) })
    }
  }

  checkConstants(value, data, name) {
    if (data.indexOf(value) === -1) {
      this.messages.push({ message: `${name} requires a valid value`, errorCode: getFullErrorCode(`${this.fileCode}ZZ07`) })
    }
  }

  checkBoolean(value, name) {
    if (!validator.isBoolean(value.toString())) {
      this.messages.push({ message: `${name} must be a boolean`, errorCode: getFullErrorCode(`${this.fileCode}ZZ08`) })
    }
  }

  checkReferentialIntegrityById(id, entity) {
    return this.referentialIntegrityService.getById(id, entity)
      .then((data) => {
        if (!data) {
          this.messages.push({ message: `${this.getEntityName()} not found for id ${id}`, errorCode: getFullErrorCode(`${this.fileCode}ZZ09`) })
        }
      })
  }

  checkRIBatch(riBatchOfGroups) {
    return Promise.all(
      _.map(riBatchOfGroups, groupSet =>
        // Note: It is assumed that all elements in the group set are either referential integrity
        // checks, or business key uniqueness checks
        this.getPromiseForRIorBusinessKeyCheck(groupSet)),
    )
  }

  checkArray(value, name, entityCount) {
    if (value.length < entityCount.min || value.length > entityCount.max) {
      this.messages.push({ message: `${name} is out of item count range(min=${entityCount.min} max=${entityCount.max}`, errorCode: getFullErrorCode(`${this.fileCode}ZZ0A`) })
    }
  }

  getPromiseForRIorBusinessKeyCheck(groupSet) {
    if (groupSet.length === 0) {
      return Promise.resolve()
    }

    const { entity } = groupSet[0]
    const ids = this.getDistinctIds(groupSet)
    if (ids.length > 0) {
      // Note: ids list is assumed to have no duplicates before calling this function
      return this.verifyIdsExist(ids, groupSet, entity)
    }
    return this.verifyBusinessKeysAreUnique(groupSet, entity)
  }

  getDistinctIds = groupSet =>
    _.chain(groupSet).map(g => g.id).filter((e => e !== undefined && e !== null)).uniq()
      .value()

  verifyIdsExist(ids, groupSet, entity) {
    // Note: ids list is assumed to have no duplicates before calling this function
    return this.referentialIntegrityService.getEntitiesByIds(ids, entity)
      .then((data) => {
        if (data.length !== ids.length) {
          this.messages.push({ message: `${this.getEntityName()} not found for ${groupSet[0].paramName}(s): ${this.getIdDifference(ids, data)}`, errorCode: getFullErrorCode(`${this.fileCode}ZZ0B`) })
        }
      })
  }

  extractBusinessKeys = groupSet => _.map(groupSet, r => ({ keys: r.keys, updateId: r.updateId }))

  verifyBusinessKeysAreUnique(groupSet, entity) {
    const businessKeyObjects = this.extractBusinessKeys(groupSet)
    return this.referentialIntegrityService.getEntitiesByKeys(
      businessKeyObjects,
      entity).then((data) => {
      if (data && data.length > 0) {
        this.messages.push({ message: `${this.getEntityName()} already exists for business keys ${this.formatBusinessKey(data)}`, errorCode: getFullErrorCode(`${this.fileCode}ZZ0C`) })
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
    throw new Error('entityName not implemented', undefined, getFullErrorCode('300003'))
  }

  check() {
    if (this.messages.length > 0) {
      const copyMessages = this.messages
      this.messages = []
      return Promise.reject(
        _.map(copyMessages, x => AppError.badRequest(x.message, undefined, x.errorCode)),
      )
    }
    return Promise.resolve()
  }
}

module.exports = BaseValidator
