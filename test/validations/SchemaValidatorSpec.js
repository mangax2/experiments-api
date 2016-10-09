const sinon = require('sinon')
const chai = require('chai')
const SchemaValidator = require('../../src/validations/SchemaValidator')
const AppError = require('../../src/services/utility/AppError')


describe('SchemaValidator', () => {
    const testObject = new SchemaValidator()

    describe('schemaElementCheck ', () => {

        it('returns error message when value is required', () => {
            (function () {
                testObject.schemaElementCheck(null, {
                    'paramName': 'name',
                    'type': 'text',
                    'lengthRange': {'min': 1, 'max': 50},
                    'required': true
                })
                testObject.check()
            }).should.throw('name is required')


        })


        it('returns error when getSchema is not implemented by subclass ', () => {
            (function () {
                testObject.getSchema()
            }).should.throw('getSchema not implemented')
        })

    })


})

