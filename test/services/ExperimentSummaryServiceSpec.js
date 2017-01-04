const sinon = require('sinon')
const chai = require('chai')
const ExperimentSummaryService = require('../../src/services/ExperimentSummaryService')
const db = require('../../src/db/DbManager')

describe('ExperimentSummaryService', () => {

    let findStub

    before(() => {
        findStub = sinon.stub(db.experimentSummary, 'find')
    })

    after(() => {
        findStub.restore()
    })

    afterEach(() => {
        findStub.reset()
    })

    describe('Get Experiment Summary By ID', () => {
        it('succeeds and returns summary when found', () => {
            const testResponse = {
                'id': 30,
                'name': 'test',
                'numberOfVariables': 0,
                'numberOfTreatments': 0,
                'numberOfExperimentalUnits': 0
            }
            findStub.resolves(testResponse)

            new ExperimentSummaryService().getExperimentSummaryById(30).then((summary) => {
                summary.should.equal(testResponse)
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })

        it('fails and returns error when no summary found', () => {
            findStub.resolves(null)

            new ExperimentSummaryService().getExperimentSummaryById(30).then((err) => {
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

            new ExperimentSummaryService().getExperimentSummaryById(30).then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })
    })
})