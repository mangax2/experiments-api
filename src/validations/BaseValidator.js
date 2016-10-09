'use strict'

const validator = require('validator')
const AppError = require('../services/utility/AppError')
const _ = require('lodash')

class BaseValidator {
    constructor() {
        this.messages = []
    }

    validate(targetObject) {
        return this.performValidations(targetObject).then(()=> {

            this.check()

        })

    }

    performValidations(targetObject) {
        return Promise.reject("performValidations validation method not implemented")

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
        // console.log('inside checkConstants'+data.indexOf(value))
        if (data.indexOf(value) == -1) {
            this.messages.push(name + ' requires a valid value')
        }
    }

    check() {
        if (this.messages.length > 0) {
            throw  _.map(this.messages, function (x) {
                return AppError.badRequest(x)
            })
        }
    }
}

module.exports = BaseValidator