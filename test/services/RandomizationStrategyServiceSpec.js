const sinon = require('sinon')
const chai = require('chai')
const RandomizationStrategyService = require('../../src/services/RandomizationStrategyService')
const db = require('../../src/db/DbManager')

describe('RandomizationStrategyService', () => {

    let findStub
    let allStub

    before(() => {
        findStub = sinon.stub(db.randomizationStrategy, 'find')
        allStub = sinon.stub(db.randomizationStrategy, 'all')
    })

    after(() => {
        findStub.restore()
        allStub.restore()
    })

    afterEach(() => {
        findStub.reset()
        allStub.reset()
    })

    describe('Get Randomization Strategy By ID', () => {
        it('succeeds and returns strategy when found', () => {
            const testResponse = {
                'response': 'test'
            }
            findStub.resolves(testResponse)

            return new RandomizationStrategyService().getRandomizationStrategyById(30).then((summary) => {
                summary.should.equal(testResponse)
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })

        it('fails and returns error when no strategy found', () => {
            findStub.resolves(null)

            return new RandomizationStrategyService().getRandomizationStrategyById(30).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Randomization Strategy Not Found for requested id')
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })

        it('fails when repo fails', () => {
            const testError = {
                'status': 500,
                'message': 'an error occurred'
            }
            findStub.rejects(testError)

            return new RandomizationStrategyService().getRandomizationStrategyById(30).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })
    })

    describe('Get All Randomization Strategies', () => {
        it('succeeds when repo succeeds', () => {
            const testResponse = {
                'response': 'test'
            }
            allStub.resolves(testResponse)

            new RandomizationStrategyService().getAllRandomizationStrategies().then((summary) => {
                summary.should.equal(testResponse)
                sinon.assert.called(
                    allStub)
            })
        })

        it('fails when repo fails', () => {
            const testError = {
                'status': 500,
                'message': 'an error occurred'
            }
            allStub.rejects(testError)

            new RandomizationStrategyService().getAllRandomizationStrategies().then((err) => {
                err.should.equal(testError)
                sinon.assert.called(
                    allStub)
            })
        })
    })
})