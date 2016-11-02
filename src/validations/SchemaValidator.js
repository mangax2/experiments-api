import BaseValidator from './BaseValidator'
import * as _ from 'lodash'
import log4js from 'log4js'

const logger = log4js.getLogger('SchemaValidator')

export class SchemaValidator extends BaseValidator {
    schemaCheck(targetObject, schema, optionalTransaction) {
        return Promise.all(
            _.map(schema, (elementSchema) => {
                const key = _.keys(targetObject).find(x=>x == elementSchema.paramName)
                if (key == null || key == undefined) {
                    return this.schemaElementCheck(null, elementSchema, targetObject, optionalTransaction)
                } else {
                    return this.schemaElementCheck(targetObject[key], elementSchema, targetObject, optionalTransaction)
                }
            })
        )
    }

    schemaElementCheck(elementValue, elementSchema, targetObject, optionalTransaction) {
        return new Promise((resolve, reject) => {
            if (elementSchema.required) {
                this.checkRequired(elementValue, elementSchema.paramName)
            }

            if (elementValue != undefined && elementValue != null) {
                if (elementSchema.type == 'numeric') {
                    this.checkNumeric(elementValue, elementSchema.paramName)
                    if(elementSchema.numericRange) {
                        this.checkNumericRange(elementValue, elementSchema.numericRange, elementSchema.paramName)
                    }
                } else if (elementSchema.type == 'text') {
                    this.checkLength(elementValue, elementSchema.lengthRange, elementSchema.paramName)
                } else if (elementSchema.type == 'constant') {
                    this.checkConstants(elementValue, elementSchema.data, elementSchema.paramName)
                }
                else if (elementSchema.type == 'boolean') {
                    this.checkBoolean(elementValue, elementSchema.paramName)
                }

                if(!this.hasErrors() && elementSchema.type == 'refData'){
                    return this.checkReferentialIntegrityById(elementValue, elementSchema.entity, elementSchema.paramName, optionalTransaction).then(() => {
                        resolve()
                    })
                }
                else{
                    resolve()
                }
            }
            else if(!this.hasErrors() && elementSchema.type == 'businessKey'){
                const vals = _.map(elementSchema.keys, (key) => {
                    return targetObject[key]
                })

                this.checkRIBusiness(targetObject['id'], vals, elementSchema.entity, elementSchema.paramName, elementSchema.keys, optionalTransaction).then(() => {
                    resolve()
                })
            }
            else{
                resolve()
            }
        })
    }

    performValidations(targetObject, operationName, optionalTransaction) {
        return this.schemaCheck(targetObject, this.getSchema(operationName), optionalTransaction)
    }

    getSchema(operationName) {
        logger.error('getSchema not implemented')
        throw 'getSchema not implemented'
    }
}

module.exports = SchemaValidator
