const validator = require('validator')
const AppError = require('../services/utility/AppError')
const _ = require('lodash')
const log4js = require('log4js')
const logger = log4js.getLogger('BaseValidator')

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
        logger.error("performValidations validation method not implemented to validate" + targetObject)
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

    check() {
        if (this.messages.length > 0) {
            const copyMessages = this.messages
            this.messages = []
            throw _.map(copyMessages, function(x){
                return AppError.badRequest(x)
            })
        }
    }
}

module.exports = BaseValidator