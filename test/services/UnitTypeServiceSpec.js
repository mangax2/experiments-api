const sinon = require('sinon')
const chai = require('chai')
const UnitTypeService = require('../../src/services/UnitTypeService')
const db = require('../../src/db/DbManager')

describe('UnitTypeService', () => {

  let findStub
  let allStub

  before(() => {
    findStub = sinon.stub(db.unitType, 'find')
    allStub = sinon.stub(db.unitType, 'all')
  })

  after(() => {
    findStub.restore()
    allStub.restore()
  })

  afterEach(() => {
    findStub.reset()
    allStub.reset()
  })

  describe('Get Unit Type By ID', () => {
    it('succeeds and returns unit type when found', () => {
      const testResponse = {
        'response': 'plot',
      }
      findStub.resolves(testResponse)

      return new UnitTypeService().getUnitTypeById(1).then((value) => {
        value.should.equal(testResponse)
        sinon.assert.calledWithExactly(
          findStub,
          1)
      })
    })

    it('fails and returns error when no strategy found', () => {
      findStub.resolves(null)

      return new UnitTypeService().getUnitTypeById(1).should.be.rejected.then((err) => {
        err.status.should.equal(404)
        err.message.should.equal('Unit Type Not Found for requested id')
        sinon.assert.calledWithExactly(
          findStub,
          1)
      })
    })

    it('fails when repo fails', () => {
      const testError = {
        'status': 500,
        'message': 'an error occurred',
      }
      findStub.rejects(testError)

      return new UnitTypeService().getUnitTypeById(1).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          findStub,
          1)
      })
    })
  })

  describe('Get All Unit Types', () => {
    it('succeeds when repo succeeds', () => {
      const testResponse = {
        'response': ['plot', 'container', 'other'],
      }
      allStub.resolves(testResponse)

      return new UnitTypeService().getAllUnitTypes().then((unitTypes) => {
        unitTypes.should.equal(testResponse)
        sinon.assert.called(
          allStub)
      })
    })

    it('fails when repo fails', () => {
      const testError = {
        'status': 500,
        'message': 'an error occurred',
      }
      allStub.rejects(testError)

      return new UnitTypeService().getAllUnitTypes().should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.called(
          allStub)
      })
    })
  })
})