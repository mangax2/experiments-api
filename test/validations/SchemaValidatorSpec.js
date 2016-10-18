const sinon = require('sinon')
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

        it('checks valid numeric', () => {
            (function() {
                testObject.schemaElementCheck(1, {
                    'paramName': 'number',
                    'type': 'numeric'
                })
                testObject.check()
            }).should.not.throw()
        })

        it('checks invalid numeric', () => {
            (function() {
                testObject.schemaElementCheck("a", {
                    'paramName': 'number',
                    'type': 'numeric'
                })
                testObject.check()
            }).should.throw()
        })

        it('checks valid numeric range', () => {
            (function() {
                testObject.schemaElementCheck(3, {
                    'paramName': 'number',
                    'type': 'numeric',
                    'numericRange': {'min': 0, 'max': 50}
                })
                testObject.check()
            }).should.not.throw()
        })

        it('checks invalid numeric range', () => {
            (function() {
                testObject.schemaElementCheck(200, {
                    'paramName': 'number',
                    'type': 'numeric',
                    'numericRange': {'min': 0, 'max': 50}
                })
                testObject.check()
            }).should.throw()
        })


        it('returns error when getSchema is not implemented by subclass ', () => {
            (function () {
                testObject.getSchema()
            }).should.throw('getSchema not implemented')
        })

    })


    describe('schemaCheck ', () => {
        const targetObj = {
            "subjectType": "plant",
            "userId": "akuma11",
            "refExperimentDesignId": 2,
            "status": "ACTIVE"
        }

        const schemaArray = [
            {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 1, 'max': 100}},
            {'paramName': 'refExperimentDesignId', 'type': 'refData'},
            {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
            {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
            {'paramName': 'isNull', 'type': 'boolean', 'required': true},
            {'paramName': 'number', 'type': 'numeric'},
            {'paramName': 'number', 'type': 'numeric', 'numericRange': {'min': 0, 'max': 100}}
        ]

        it('returns error message when value is required', () => {
            (function () {
                testObject.schemaCheck(targetObj, schemaArray)
                testObject.check()
            }).should.throw('Error: name is required,Error: isNull is required')

        })

        it('returns error message when targetObj is empty object', () => {

            (function () {
                testObject.schemaCheck({}, schemaArray)
                testObject.check()
            }).should.throw('Error: name is required,Error: status is required,Error: userId is required')

        })

    })


    describe('getSchema ', () => {

        it('returns error message when getSchema is called directly', () => {
            (function () {
                testObject.getSchema()
            }).should.throw('getSchema not implemented')

        })


    })

})

