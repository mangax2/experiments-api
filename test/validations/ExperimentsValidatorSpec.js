const sinon = require('sinon')
const ExperimentsValidator = require('../../src/validations/ExperimentsValidator')
const AppError = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'

describe('ExperimentValidator', () => {
    let target = new ExperimentsValidator()
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
        {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 0, 'max': 100}},
        {'paramName': 'refExperimentDesignId', 'type': 'refData', 'entity': db.experimentDesign},
        {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            target.getSchema().should.eql(schemaArray)
        })
    })

    describe('entityName', () => {
        it('returns name of the entity', () => {
            target.entityName.should.equal('Experiment')
        })
    })


    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Experiments request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Experiments request object needs to be an array')
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

