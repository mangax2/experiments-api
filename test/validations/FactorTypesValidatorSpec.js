const sinon = require('sinon')
const chai = require('chai')
const FactorTypesValidator = require('../../src/validations/FactorTypesValidator')
// const AppError = require('../../src/services/utility/AppError')

describe('FactorTypesValidator', () => {
    const factorTypesValidator = new FactorTypesValidator()
    const schemaArray = [
        {'paramName': 'type', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            return factorTypesValidator.getSchema().should.eql(schemaArray)
        })
    })

    describe('performValidations ', () => {
        it('returns resolved promise when good value passed for schema validation', () => {
            const targetObj = [{
                "type": "testDesign",
            }]
            return factorTypesValidator.performValidations(targetObj).should.be.fulfilled
        })

        it('returns rejected promise when targetObject is not an array', () => {
            (()=>{
                factorTypesValidator.performValidations({})
            }).should.throw("Factor Types request object needs to be an array")

        })


    })
})

