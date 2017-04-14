import log4js from 'log4js'
import * as _ from 'lodash'
import BaseValidator from './BaseValidator'
import AppError from '../services/utility/AppError'

const logger = log4js.getLogger('SchemaValidator')

export class SchemaValidator extends BaseValidator {
  schemaCheck(targetObject, schema, optionalTransaction) {
    return Promise.all(
      _.map(schema, (elementSchema) => {
        const key = _.keys(targetObject).find(x => x == elementSchema.paramName)
        if (key == null || key == undefined) {
          return this.schemaElementCheck(null, elementSchema, targetObject, optionalTransaction)
        }
        return this.schemaElementCheck(targetObject[key], elementSchema, targetObject, optionalTransaction)
      }),
    )
  }

  schemaElementCheck(elementValue, elementSchema, targetObject, optionalTransaction) {
    return new Promise((resolve, reject) => {
      if (this.literalCheck(elementValue, elementSchema.paramName)) {
        if (elementSchema.required) {
          this.checkRequired(elementValue, elementSchema.paramName)
        }

        if (elementValue != undefined && elementValue != null) {
          if (elementSchema.type == 'numeric') {
            this.checkNumeric(elementValue, elementSchema.paramName)
            if (elementSchema.numericRange) {
              this.checkNumericRange(elementValue, elementSchema.numericRange, elementSchema.paramName)
            }
          } else if (elementSchema.type == 'text') {
            this.checkLength(elementValue, elementSchema.lengthRange, elementSchema.paramName)
          } else if (elementSchema.type == 'constant') {
            this.checkConstants(elementValue, elementSchema.data, elementSchema.paramName)
          } else if (elementSchema.type == 'boolean') {
            this.checkBoolean(elementValue, elementSchema.paramName)
          }
        }
      }
      resolve()
    })
  }

  validateEntity(targetObject, operationName, optionalTransaction) {
    return this.schemaCheck(targetObject, this.getSchema(operationName), optionalTransaction)
  }

  validateBatchForRI(batchPayload, operationName, optionalTransaction) {
    return new Promise((resolve, reject) => {
      const riSchema = _.filter(this.getSchema(operationName), schema => schema.type == 'refData' || schema.type == 'businessKey')
      const riCheckArray = []
      _.map(riSchema, (schema) => {
        _.forEach(batchPayload, (p) => {
          const riCheckObj = {}
          const key = _.keys(p).find(x => x == schema.paramName)
          riCheckObj.entity = schema.entity
          riCheckObj.updateId = p.id
          if (schema.type == 'businessKey') {
            const vals = _.map(schema.keys, key => p[key])
            riCheckObj.keys = vals
          } else {
            riCheckObj.id = p[key]
          }
          riCheckObj.paramName = schema.paramName
          if (riCheckObj.keys || riCheckObj.id) {
            riCheckArray.push(riCheckObj)
          }
        })
      })

      if (riCheckArray.length == 0) {
        resolve()
      } else {
        const riCheckGroupByEntity = _.values(_.groupBy(riCheckArray, 'paramName'))
        return this.checkRIBatch(riCheckGroupByEntity, optionalTransaction).then(() => {
          resolve()
        }, (err) => {
          reject(err)
        })
      }
    })
  }

  postValidate(targetObject) {
    if (!this.hasErrors()) {
      // Check the business key
      const uniqArray = _.uniqWith(_.map(targetObject, obj => _.pick(obj, this.getBusinessKeyPropertyNames())), _.isEqual)

      if (uniqArray.length != targetObject.length) {
        return Promise.reject(
          AppError.badRequest(this.getDuplicateBusinessKeyError()),
        )
      }
    }

    return Promise.resolve()
  }

  getSchema(operationName) {
    logger.error('getSchema not implemented')
    throw 'getSchema not implemented'
  }

  getBusinessKeyPropertyNames() {
    logger.error('getBusinessKeyPropertyNames not implemented')
    throw 'getBusinessKeyPropertyNames not implemented'
  }

  getDuplicateBusinessKeyError() {
    logger.error('getDuplicateBusinessKeyError not implemented')
    throw 'getDuplicateBusinessKeyError not implemented'
  }
}

module.exports = SchemaValidator
