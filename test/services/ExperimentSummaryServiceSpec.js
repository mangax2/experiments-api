const sinon = require('sinon')
const chai = require('chai')
const ExperimentSummaryService = require('../../src/services/ExperimentSummaryService')
const db = require('../../src/db/DbManager')

describe('ExperimentSummaryService', () => {

  let findStub, experimentFindStub, target
  const tx = { tx: {} }
  before(() => {
    findStub = sinon.stub(db.experimentSummary, 'find')
    target = new ExperimentSummaryService()
    experimentFindStub = sinon.stub(target._experimentService, 'getExperimentById')
  })

  after(() => {
    findStub.restore()
    experimentFindStub.restore()
  })

  afterEach(() => {
    findStub.reset()
    experimentFindStub.reset()
  })

  describe('Get Experiment Summary By ID', () => {
    it('succeeds and returns summary when found', () => {
      const testResponse = {
        'id': 30,
        'name': 'test',
        'numberOfVariables': 0,
        'numberOfTreatments': 0,
        'numberOfExperimentalUnits': 0,
      }
      findStub.resolves(testResponse)
      experimentFindStub.resolves()

      return target.getExperimentSummaryById(30, tx).then((summary) => {
        summary.should.equal(testResponse)
        sinon.assert.calledWithExactly(
          findStub,
          30, tx)
      })
    })

    it('fails and returns error when no summary found', () => {
      findStub.resolves(null)
      experimentFindStub.resolves()
      return target.getExperimentSummaryById(30, tx).should.be.rejected.then((err) => {
        err.status.should.equal(404)
        err.message.should.equal('Experiment Summary Not Found for requested experimentId')
        sinon.assert.calledWithExactly(
          findStub,
          30, tx)
      })
    })

    it('fails when repo fails', () => {
      const testError = {
        'status': 500,
        'message': 'an error occurred',
      }
      findStub.rejects(testError)
      experimentFindStub.resolves()
      return target.getExperimentSummaryById(30, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          findStub,
          30, tx)
      })
    })

    it('fails when ExperimentService.getExperimentById  fails', () => {
      const testError = {
        'status': 404,
        'message': 'Experiment Not Found for requested experimentId = 30',
      }
      experimentFindStub.rejects(testError)
      return target.getExperimentSummaryById(30, tx).should.be.rejected.then((err) => {
        err.status.should.equal(404)
        err.message.should.equal('Experiment Not Found for requested experimentId = 30')
        sinon.assert.notCalled(
          findStub,
        )
      })
    })

  })
})