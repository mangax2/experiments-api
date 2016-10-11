const sinon = require('sinon')
const chai = require('chai')
const ExperimentDesignsValidator = require('../../src/validations/ExperimentDesignsValidator')
// const AppError = require('../../src/services/utility/AppError')

describe('ExperimentDesignsValidator', () => {
    const experimentDesignsValidator = new ExperimentDesignsValidator()
    const schemaArray = [
        {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            return experimentDesignsValidator.getSchema().should.eql(schemaArray)
        })
    })

    describe('performValidations ', () => {
        it('returns resolved promise when good value passed for schema validation', () => {
            const targetObj = [{
                "name": "testDesign",
            }]
            return experimentDesignsValidator.performValidations(targetObj).should.be.fulfilled
        })


    })
})

