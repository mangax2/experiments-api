const sinon = require('sinon')
const SchemaValidator = require('../../src/validations/SchemaValidator')
const AppError = require('../../src/services/utility/AppError')

describe('SchemaValidator', () => {
    const testObject = new SchemaValidator()

    describe('schemaElementCheck ', () => {

        it('returns error message when value is required', () => {
            return testObject.schemaElementCheck(null, {
                'paramName': 'name',
                'type': 'text',
                'lengthRange': {'min': 1, 'max': 50},
                'required': true
            }).then(() => {
                return testObject.check().should.be.rejected.then((err) => {
                    err.length.should.equal(1)
                    err[0].errorMessage.should.equal('name is required')
                })
            })
        })

        it('checks valid numeric', () => {
            return testObject.schemaElementCheck(1, {
                'paramName': 'number',
                'type': 'numeric'
            }).then(() => {
                return testObject.check()
            })
        })

        it('checks invalid numeric', () => {
            return testObject.schemaElementCheck("a", {
                'paramName': 'number',
                'type': 'numeric'
            }).then(() => {
                return testObject.check()
            }).should.be.rejected.then((err) => {
                err.length.should.equal(1)
                err[0].errorMessage.should.equal('number must be numeric')
            })
        })

        it('checks valid numeric range', () => {
            return testObject.schemaElementCheck(3, {
                'paramName': 'number',
                'type': 'numeric',
                'numericRange': {'min': 0, 'max': 50}
            }).then(() => {
                return testObject.check()
            })
        })

        it('checks invalid numeric range', () => {
            return testObject.schemaElementCheck(200, {
                'paramName': 'number',
                'type': 'numeric',
                'numericRange': {'min': 0, 'max': 50}
            }).then(() => {
                return testObject.check()
            }).should.be.rejected.then((err) => {
                err.length.should.equal(1)
                err[0].errorMessage.should.equal('number value is out of numeric range(min=0 max=50)')
            })
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
            return testObject.schemaCheck(targetObj, schemaArray).then(() => {
                return testObject.check().should.be.rejected.then((err) => {
                    err.length.should.equal(2)
                    err[0].errorMessage.should.equal('name is required')
                    err[1].errorMessage.should.equal('isNull is required')
                })
            })
        })

        it('returns error message when targetObj is empty object', () => {
            return testObject.schemaCheck({}, schemaArray).then(() => {
                return testObject.check().should.be.rejected.then((err) => {
                    err.length.should.equal(4)
                    err[0].errorMessage.should.equal('name is required')
                    err[1].errorMessage.should.equal('status is required')
                    err[2].errorMessage.should.equal('userId is required')
                    err[3].errorMessage.should.equal('isNull is required')
                })
            })
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

