import validator from 'validator'
import AppError from '../services/utility/AppError'
import * as _ from 'lodash'
import log4js from 'log4js'
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

    _validateArray(objectArray, operationName, optionalTransaction) {
        return Promise.all(
            _.map(objectArray, (element) => {
                return this.validateEntity(element, operationName, optionalTransaction)
            })
        ).then(()=> {
            if (!this.hasErrors()) {
                return this.validateBatchForRI(objectArray, operationName, optionalTransaction)
            }
        })
    }

    _validateArrayOrSingleEntity(targetObject, operationName, optionalTransaction) {
        return _.isArray(targetObject)
            ? this._validateArray(targetObject, operationName, optionalTransaction)
            : this.validateEntity(targetObject, operationName, optionalTransaction)
    }

    validate(targetObject, operationName, optionalTransaction) {
        return this.preValidate(targetObject).then(() => {
            return this._validateArrayOrSingleEntity(
                targetObject, operationName, optionalTransaction
            ).then(() => {
                return this.postValidate(targetObject)
            }).then(() => {
                return this.check()
            })
        })
    }


    preValidate(targetObject) {
        return Promise.resolve()
    }

    postValidate(targetObject) {
        return Promise.resolve()
    }

    validateEntity(targetObject, operationName, optionalTransaction) {
        logger.error("validateEntity validation method not implemented to validate" + targetObject)
        return Promise.reject("Server error, please contact support")
    }


    validateBatchForRI(batchPayload, operationName, optionalTransaction) {
        logger.error("validateBatchForRI validation method not implemented to validate")
        return Promise.reject("Server error, please contact support")
    }

    checkLength(value, lengthRange, name) {
        if (!validator.isLength(value, lengthRange.min, lengthRange.max)) {
            this.messages.push(name + ' length is out of range(min=' + lengthRange.min + ' max=' + lengthRange.max + ')')
        }
    }

    checkRequired(value, name) {
        if (value == undefined || value == null || validator.isEmpty(value.toString())) {
            this.messages.push(name + ' is required')
        }
    }

    checkNumeric(value, name) {
        if (!validator.isNumeric(value.toString())) {
            this.messages.push(name + ' must be numeric')
        }
    }

    checkNumericRange(value, numericRange, name) {
        if (value < numericRange.min || value > numericRange.max) {
            this.messages.push(name + ' value is out of numeric range(min=' + numericRange.min + ' max=' + numericRange.max + ')')
        }
    }

    checkConstants(value, data, name) {
        if (data.indexOf(value) == -1) {
            this.messages.push(name + ' requires a valid value')
        }
    }

    checkBoolean(value, name) {
        if (!validator.isBoolean(value.toString())) {
            this.messages.push(name + ' must be boolean')
        }
    }

    checkReferentialIntegrityById(id, entity, optionalTransaction) {
        return this.referentialIntegrityService.getById(id, entity, optionalTransaction).then((data) => {
            if (!data) {
                this.messages.push(`${this.getEntityName()} not found for id ${id}`)
            }
        })
    }

    checkRIBatch(riBatchOfGroups, optionalTransaction) {
        return Promise.all(
            _.map(riBatchOfGroups, (groupSet)=> {
                // Note: It is assumed that all elements in the group set are either referential integrity
                // checks, or business key uniqueness checks
                return this._getPromiseForRIorBusinessKeyCheck(groupSet, optionalTransaction)
            })
        )
    }

    _getPromiseForRIorBusinessKeyCheck(groupSet, optionalTransaction) {
        if (groupSet.length == 0) {
            return Promise.resolve()
        }

        const entity = groupSet[0].entity
        const ids = this._getDistinctIds(groupSet)
        if (ids.length > 0) {
            // Note: ids list is assumed to have no duplicates before calling this function
            return this._verifyIdsExist(ids, groupSet, entity, optionalTransaction)
        } else {
            return this._verifyBusinessKeysAreUnique(groupSet, entity, optionalTransaction)
        }
    }

    _getDistinctIds(groupSet) {
        return _.chain(groupSet).map(g=>g.id).filter((e=>e != undefined)).uniq().value()
    }

    _verifyIdsExist(ids, groupSet, entity, optionalTransaction) {
        // Note: ids list is assumed to have no duplicates before calling this function
        return this.referentialIntegrityService.getEntitiesByIds(ids, entity, optionalTransaction).then((data) => {
            if (data.length != ids.length) {
                this.messages.push(`${this.getEntityName()} not found for ${groupSet[0].paramName}(s): ` + this._getIdDifference(ids, data))
            }
        })
    }

    _extractBusinessKeys(groupSet) {
        return _.map(groupSet, (r)=> {
            return {keys: r.keys, updateId: r.updateId}
        })
    }

    _verifyBusinessKeysAreUnique(groupSet, entity, optionalTransaction) {
        const businessKeyObjects = this._extractBusinessKeys(groupSet)
        return this.referentialIntegrityService.getEntitiesByKeys(businessKeyObjects, entity, optionalTransaction).then((data) => {
            if (data && data.length > 0) {
                this.messages.push(`${this.getEntityName()} already exists for business keys${this._formatBusinessKey(data)}`)
            }
        })
    }

    _getIdDifference(ids, data) {
        const idsFromDb = _.map(data, (d)=>d.id)
        return _.difference(ids, idsFromDb)
    }

    _formatBusinessKey(dataFromDb) {
        const result = _.map(dataFromDb, (d)=>JSON.stringify(d).replace(/\"/g, ""))
        return result.join()
    }

    getEntityName() {
        throw 'entityName not implemented'
    }

    check() {
        if (this.messages.length > 0) {
            const copyMessages = this.messages
            this.messages = []
            return Promise.reject(
                _.map(copyMessages, function (x) {
                    return AppError.badRequest(x)
                })
            )
        } else {
            return Promise.resolve()
        }
    }
}

module.exports = BaseValidator
