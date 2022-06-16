import * as _ from 'lodash'
import BaseValidator from './BaseValidator'
import AppError from '../services/utility/AppError'

class SchemaValidator extends BaseValidator {
  schemaCheck(targetObject, schema, optionalTransaction) {
    return Promise.all(
      _.map(schema, (elementSchema) => {
        const key = _.keys(targetObject).find(x => x === elementSchema.paramName)
        if (key === null || key === undefined) {
          return this.schemaElementCheck(null, elementSchema, targetObject, optionalTransaction)
        }
        return this.schemaElementCheck(
          targetObject[key],
          elementSchema,
          targetObject,
          optionalTransaction,
        )
      }),
    )
  }

  schemaElementCheck(elementValue, elementSchema) {
    return new Promise((resolve) => {
      if (this.literalCheck(elementValue, elementSchema.paramName, elementSchema.type)) {
        if (elementSchema.required) {
          this.checkRequired(elementValue, elementSchema.paramName)
        }

        if (elementValue !== undefined && elementValue !== null) {
          if (elementSchema.type === 'numeric') {
            this.checkNumeric(elementValue, elementSchema.paramName)
            if (elementSchema.numericRange) {
              this.checkNumericRange(
                elementValue,
                elementSchema.numericRange,
                elementSchema.paramName,
              )
            }
          } else if (elementSchema.type === 'text') {
            this.checkLength(elementValue, elementSchema.lengthRange, elementSchema.paramName)
          } else if (elementSchema.type === 'constant') {
            this.checkConstants(elementValue, elementSchema.data, elementSchema.paramName)
          } else if (elementSchema.type === 'boolean') {
            this.checkBoolean(elementValue, elementSchema.paramName)
          } else if (elementSchema.type === 'array') {
            this.checkArray(elementValue, elementSchema.paramName, elementSchema.entityCount)
          } else if (elementSchema.type === 'integer') {
            this.checkInteger(elementValue, elementSchema.paramName)
          }
        }
      }
      resolve()
    })
  }

  validateEntity = (targetObject, operationName, optionalTransaction) =>
    this.schemaCheck(targetObject, this.getSchema(operationName), optionalTransaction)

  validateBatchForRI = (batchPayload, operationName, optionalTransaction) =>
    new Promise((resolve, reject) => {
      const riSchema = _.filter(this.getSchema(operationName), schema => schema.type === 'refData' || schema.type === 'businessKey')
      const riCheckArray = []

      _.map(riSchema, (schema) => {
        _.forEach(batchPayload, (p) => {
          const riCheckObj = {}
          const key = _.keys(p).find(x => x === schema.paramName)

          riCheckObj.entity = schema.entity
          riCheckObj.updateId = p.id

          if (schema.type === 'businessKey') {
            riCheckObj.keys = _.map(schema.keys, k => p[k])
          } else {
            riCheckObj.id = p[key]
          }
          riCheckObj.paramName = schema.paramName

          if (riCheckObj.keys || riCheckObj.id) {
            riCheckArray.push(riCheckObj)
          }
        })
      })

      if (riCheckArray.length === 0) {
        resolve()
      }

      const riCheckGroupByEntity = _.values(_.groupBy(riCheckArray, 'paramName'))
      this.checkRIBatch(riCheckGroupByEntity, optionalTransaction).then(() => {
        resolve()
      }, (err) => {
        reject(err)
      })
    })

  postValidate = (targetObject) => {
    if (!this.hasErrors()) {
      // Check the business key
      const uniqArray = _.uniqWith(
        _.map(targetObject, obj => _.pick(obj, this.getBusinessKeyPropertyNames())), _.isEqual,
      )

      if (uniqArray.length !== targetObject.length) {
        return Promise.reject(
          AppError.badRequest(this.getDuplicateBusinessKeyError()),
        )
      }
    }

    return Promise.resolve()
  }

  getSchema = () => {
    console.error('getSchema not implemented')
    throw new Error('getSchema not implemented')
  }

  getBusinessKeyPropertyNames = () => {
    console.error('getBusinessKeyPropertyNames not implemented')
    throw new Error('getBusinessKeyPropertyNames not implemented')
  }

  getDuplicateBusinessKeyError = () => {
    console.error('getDuplicateBusinessKeyError not implemented')
    throw new Error('getDuplicateBusinessKeyError not implemented')
  }
}

module.exports = SchemaValidator
