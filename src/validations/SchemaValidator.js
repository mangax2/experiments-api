const BaseValidator = require('./BaseValidator')
const _ = require('lodash')
const log4js = require('log4js')
const logger = log4js.getLogger('SchemaValidator')

export class SchemaValidator extends BaseValidator {

    schemaCheck(targetObject, schema) {
        return Promise.all(
            _.map(schema, (elementSchema) => {
                const key = _.keys(targetObject).find(x=>x == elementSchema.paramName)
                if (key == null || key == undefined) {
                    return this.schemaElementCheck(null, elementSchema)
                } else {
                    return this.schemaElementCheck(targetObject[key], elementSchema)
                }
            })
        )
    }

    schemaElementCheck(elementValue, elementSchema) {
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

                if(elementSchema.type == 'refData'){
                    return this.checkReferentialIntegrityById(elementValue, elementSchema.entity, elementSchema.paramName).then(() => {
                        resolve()
                    })
                }
                else{
                    resolve()
                }
            }
        })
    }

    performValidations(targetObject) {
        return this.schemaCheck(targetObject, this.getSchema())
    }

    getSchema() {
        logger.error('getSchema not implemented')
        throw 'getSchema not implemented'

    }

}

module.exports = SchemaValidator