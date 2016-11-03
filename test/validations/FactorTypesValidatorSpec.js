const sinon = require('sinon')
const chai = require('chai')
const FactorTypesValidator = require('../../src/validations/FactorTypesValidator')
import db from '../../src/db/DbManager'
let findStub

describe('FactorTypesValidator', () => {
    const factorTypesValidator = new FactorTypesValidator()
    before(() => {
        findStub = sinon.stub(factorTypesValidator.referentialIntegrityService, 'getByBusinessKey')

    })
    after(() => {
        findStub.restore()
    })
    afterEach(() => {
        findStub.reset()
    })


    const schemaArray = [
        {'paramName': 'type', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        {'paramName': 'FactorType', 'type': 'businessKey', 'keys': ['type'], 'entity': db.factorType}

    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            return factorTypesValidator.getSchema().should.eql(schemaArray)
        })
    })

    describe('performValidations ', () => {
        it('returns resolved promise when good value passed for schema validation', () => {
            findStub.resolves({'id': 1})

            const targetObj = [{
                "type": "testDesign",
            }]
            return factorTypesValidator.performValidations(targetObj).should.be.fulfilled
        })

        it('returns rejected promise when targetObject is not an array', () => {
            (()=> {
                factorTypesValidator.performValidations({})
            }).should.throw("Factor Types request object needs to be an array")

        })


    })
})

