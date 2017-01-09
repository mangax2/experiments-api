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

            new RandomizationStrategyService().getRandomizationStrategyById(30).then((summary) => {
                summary.should.equal(testResponse)
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })

        it('fails and returns error when no strategy found', () => {
            findStub.resolves(null)

            new RandomizationStrategyService().getRandomizationStrategyById(30).then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Experiment Summary Not Found for requested experimentId')
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

            new RandomizationStrategyService().getRandomizationStrategyById(30).then((err) => {
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