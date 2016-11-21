const AppError = require('../../src/services/utility/AppError')
const sinon = require('sinon')
const chai = require('chai')
const FactorTypesValidator = require('../../src/validations/FactorTypesValidator')
import db from '../../src/db/DbManager'

describe('FactorTypesValidator', () => {
    const target = new FactorTypesValidator()
    const testError = new Error('Test Error')

    let badRequestStub

    before(() => {
        badRequestStub = sinon.stub(AppError, 'badRequest', () => {
            return testError
        })
    })

    afterEach(() => {
        badRequestStub.reset()
    })

    after(() => {
        badRequestStub.restore()
    })

    const schemaArray = [
        {'paramName': 'type', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        {'paramName': 'FactorType', 'type': 'businessKey', 'keys': ['type'], 'entity': db.factorType}

    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            return target.getSchema().should.eql(schemaArray)
        })
    })

    describe('entityName', () => {
        it('returns name of the entity', () => {
            target.getEntityName().should.equal('FactorType')
        })
    })

    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Factor Types request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Factor Types request object needs to be an array')
            })
        })

        it('returns resolved promise when input is non-empty array.' , () => {
            return target.preValidate([{}]).then(() => {
                sinon.assert.notCalled(badRequestStub)
            })
        })
    })

    describe('postValidate ', () => {
        it('returns resolved promise', () => {
            const r = target.postValidate({})
            r.should.be.instanceof(Promise)
            return r
        })
    })
})

