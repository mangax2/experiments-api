const BaseValidator = require('./BaseValidator')
const _ = require('lodash')
const log4js = require('log4js')
const logger = log4js.getLogger('SchemaValidator')

export class SchemaValidator extends BaseValidator {


    schemaCheck(targetObject, schema) {
        _.map(schema, (elementSchema) => {
            const key = _.keys(targetObject).find(x=>x == elementSchema.paramName)
            if (key == null || key == undefined) {
                this.schemaElementCheck(null, elementSchema)
            } else {
                this.schemaElementCheck(targetObject[key], elementSchema)
            }
        })

    }

    schemaElementCheck(elementValue, elementSchema) {
        if (elementSchema.required) {
            this.checkRequired(elementValue, elementSchema.paramName)
        }

        if (elementValue != undefined && elementValue != null) {
            if (elementSchema.type == 'numeric') {
                this.checkNumeric(elementValue, elementSchema.paramName)
                this.checkNumericRange(elementValue, elementSchema.numericRange, elementSchema.paramName)
            } else if (elementSchema.type == 'text') {
                this.checkLength(elementValue, elementSchema.lengthRange, elementSchema.paramName)
            } else if (elementSchema.type == 'constant') {
                this.checkConstants(elementValue, elementSchema.data, elementSchema.paramName)
            }
        }

    }


    performValidations(targetObject) {
        return new Promise((resolve) => {
            if (this.getSchema() == null || this.getSchema() == undefined) {
                logger.error('getSchema not implemented')
                throw 'getSchema not implemented'
            }
            this.schemaCheck(targetObject, this.getSchema())
            resolve()
        })
    }

    getSchema() {
        logger.error('getSchema not implemented')
        throw 'getSchema not implemented'

    }

}

module.exports = SchemaValidator