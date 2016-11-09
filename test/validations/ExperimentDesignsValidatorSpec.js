const sinon = require('sinon')
const chai = require('chai')
const  AppError  = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'
const ExperimentDesignsValidator = require('../../src/validations/ExperimentDesignsValidator')
const SchemaValidator = require('../../src/validations/SchemaValidator')

describe('ExperimentDesignsValidator', () => {
    let target = new ExperimentDesignsValidator()
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
        {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        {'paramName': 'ExperimentDesign', 'type': 'businessKey', 'keys': ['name'], 'entity': db.experimentDesign}

    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            return target.getSchema().should.eql(schemaArray)
        })
    })

    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Experiment Designs request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Experiment Designs request object needs to be an array')
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

