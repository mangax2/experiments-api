'use strict'
const BaseValidator = require('./BaseValidator')
const _ = require('lodash')


export class SchemaValidator extends BaseValidator {

    schemaCheck(targetObject, schema) {
        _.map(_.keys(targetObject), (key)=> {
            const elementSchema = schema.find(x=>x.paramName == key)
            if (elementSchema != null && elementSchema != undefined) {
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
            this.schemaCheck(targetObject, this.getSchema())
            resolve()
        })
    }

    getSchema() {

        throw 'getSchema not implemented'

    }

}

module.exports = SchemaValidator