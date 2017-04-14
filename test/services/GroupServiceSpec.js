import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
const sinon = require('sinon')
const chai = require('chai')
const GroupService = require('../../src/services/GroupService')
const db = require('../../src/db/DbManager')

describe('GroupService', () => {
  let target

  const testGroups = []
  const testData = {}
  const testPostResponse = {}
  const testError = {}
  const testContext = {}
  const tx = { tx: {} }

  let getExperimentByIdStub
  let createPostResponseStub
  let createPutResponseStub
  let notFoundStub
  let validateStub
  let findStub
  let findAllByExperimentIdStub
  let batchCreateStub
  let batchUpdateStub
  let removeStub
  let removeByExperimentIdStub
  let batchFindStub

  before(() => {
    target = new GroupService()

    getExperimentByIdStub = sinon.stub(target._experimentService, 'getExperimentById')
    createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
    createPutResponseStub = sinon.stub(AppUtil, 'createPutResponse')
    notFoundStub = sinon.stub(AppError, 'notFound')
    validateStub = sinon.stub(target._validator, 'validate')
    findStub = sinon.stub(db.group, 'find')
    findAllByExperimentIdStub = sinon.stub(db.group, 'findAllByExperimentId')
    batchCreateStub = sinon.stub(db.group, 'batchCreate')
    batchUpdateStub = sinon.stub(db.group, 'batchUpdate')
    removeStub = sinon.stub(db.group, 'remove')
    removeByExperimentIdStub = sinon.stub(db.group, 'removeByExperimentId')
    batchFindStub = sinon.stub(db.group, 'batchFind')

  })

  afterEach(() => {
    getExperimentByIdStub.reset()
    createPostResponseStub.reset()
    createPutResponseStub.reset()
    notFoundStub.reset()
    validateStub.reset()
    findStub.reset()
    findAllByExperimentIdStub.reset()
    batchCreateStub.reset()
    batchUpdateStub.reset()
    removeStub.reset()
    removeByExperimentIdStub.reset()
    batchFindStub.reset()

  })

  after(() => {
    getExperimentByIdStub.restore()
    createPostResponseStub.restore()
    createPutResponseStub.restore()
    notFoundStub.restore()
    validateStub.restore()
    findStub.restore()
    findAllByExperimentIdStub.restore()
    batchCreateStub.restore()
    batchUpdateStub.restore()
    removeStub.restore()
    removeByExperimentIdStub.restore()
    batchFindStub.restore()
  })

  describe('batchCreateFactors', () => {
    it('returns rejected promise when validate fails', () => {
      validateStub.rejects(testError)

      return target.batchCreateGroups(testGroups, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testGroups),
          'POST')
        sinon.assert.notCalled(batchCreateStub)
        sinon.assert.notCalled(createPostResponseStub)
      })
    })

    it('returns rejected promise when batchCreate fails', () => {
      validateStub.resolves()
      batchCreateStub.rejects(testError)

      return target.batchCreateGroups(testGroups, testContext, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testGroups),
          'POST',
          sinon.match.same(tx))
        sinon.assert.calledWith(batchCreateStub,
          sinon.match.same(testGroups),
          sinon.match.same(testContext),
          sinon.match.same(tx))
        sinon.assert.notCalled(createPostResponseStub)
      })
    })

    it('returns resolved promise with data when all calls are success', () => {
      validateStub.resolves()
      batchCreateStub.resolves(testData)
      createPostResponseStub.returns(testPostResponse)

      return target.batchCreateGroups(testGroups, tx).then((r) => {
        r.should.equal(testPostResponse)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testGroups),
          'POST')
        sinon.assert.calledWith(batchCreateStub,
          sinon.match.same(testGroups),
          sinon.match.same(tx))
        sinon.assert.calledWith(createPostResponseStub,
          sinon.match.same(testData))
      })
    })
  })

  describe('getGroupsByExperimentId', () => {
    it('returns rejected promise when getExperimentById fails', () => {
      getExperimentByIdStub.rejects(testError)

      return target.getGroupsByExperimentId(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          getExperimentByIdStub,
          7,
          sinon.match.same(tx))
        sinon.assert.notCalled(findAllByExperimentIdStub)
      })
    })

    it('returns rejected promise when findAllByExperimentId fails', () => {
      getExperimentByIdStub.resolves()
      findAllByExperimentIdStub.rejects(testError)

      return target.getGroupsByExperimentId(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          getExperimentByIdStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(
          findAllByExperimentIdStub,
          7,
          sinon.match.same(tx))
      })
    })

    it('returns resolved promise from getByExperimentId method upon success', () => {
      getExperimentByIdStub.resolves()
      findAllByExperimentIdStub.resolves(testData)

      return target.getGroupsByExperimentId(7, tx).then((data) => {
        data.should.equal(testData)
        sinon.assert.calledWith(
          getExperimentByIdStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(
          findAllByExperimentIdStub,
          7,
          sinon.match.same(tx))
      })
    })
  })

  describe('getGroupsById', () => {
    it('returns rejected promise when find fails', () => {
      findStub.rejects(testError)

      return target.getGroupById(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          findStub,
          7,
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })

    it('returns rejected promise when data is null', () => {
      findStub.resolves(null)
      notFoundStub.returns(testError)

      return target.getGroupById(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          findStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Group Not Found for requested id')
      })
    })

    it('returns rejected promise when data is undefined', () => {
      findStub.resolves(undefined)
      notFoundStub.returns(testError)

      return target.getGroupById(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          findStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Group Not Found for requested id')
      })
    })

    it('returns resolved promise with data on success', () => {
      findStub.resolves(testData)

      return target.getGroupById(7, tx).then((r) => {
        r.should.equal(testData)
        sinon.assert.calledWith(
          findStub,
          7,
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })
  })

  describe('batchGetGroupsByIds', () => {
    it('returns rejected promise when batchFind fails', () => {
      batchFindStub.rejects(testError)

      return target.batchGetGroupsByIds([7], tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          batchFindStub,
          [7],
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })

    it('returns rejected promise when data count does not match id count', () => {
      batchFindStub.resolves({}, null, {})
      notFoundStub.returns(testError)

      return target.batchGetGroupsByIds([1, 2, 3], tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          batchFindStub,
          [1, 2, 3],
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Group not found for all requested ids.')
      })
    })

    it('returns resolved promise when data found for all ids', () => {
      const findResult = [{}, {}, {}]
      batchFindStub.resolves(findResult)

      return target.batchGetGroupsByIds([1, 2, 3], tx).then((r) => {
        r.should.equal(findResult)
        sinon.assert.calledWith(
          batchFindStub,
          [1, 2, 3],
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })
  })

  describe('batchUpdateGroups', () => {
    it('returns rejected promise when validate fails', () => {
      validateStub.rejects(testError)

      return target.batchUpdateGroups(testGroups, testContext, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testGroups),
          'PUT',
          sinon.match.same(tx))
        sinon.assert.notCalled(batchUpdateStub)
        sinon.assert.notCalled(createPutResponseStub)
      })
    })

    it('returns rejected promise when batchUpdate fails', () => {
      validateStub.resolves()
      batchUpdateStub.rejects(testError)

      return target.batchUpdateGroups(testGroups, testContext, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testGroups),
          'PUT',
          sinon.match.same(tx))
        sinon.assert.calledWith(batchUpdateStub,
          sinon.match.same(testGroups),
          sinon.match.same(testContext),
          sinon.match.same(tx))
        sinon.assert.notCalled(createPutResponseStub)
      })
    })

    it('returns resolved promise with data when all calls are success', () => {
      validateStub.resolves()
      batchUpdateStub.resolves(testData)
      createPutResponseStub.returns(testPostResponse)

      return target.batchUpdateGroups(testGroups, testContext, tx).then((r) => {
        r.should.equal(testPostResponse)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testGroups),
          'PUT',
          sinon.match.same(tx))
        sinon.assert.calledWith(batchUpdateStub,
          sinon.match.same(testGroups),
          sinon.match.same(testContext),
          sinon.match.same(tx))
        sinon.assert.calledWith(createPutResponseStub,
          sinon.match.same(testData))
      })
    })
  })

  describe('deleteFactor', () => {
    it('returns rejected promise when remove fails', () => {
      removeStub.rejects(testError)

      return target.deleteGroup(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          removeStub,
          7,
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })

    it('returns rejected promise when data is null', () => {
      removeStub.resolves(null)
      notFoundStub.returns(testError)

      return target.deleteGroup(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          removeStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Group Not Found for requested id')
      })
    })

    it('returns rejected promise when data is undefined', () => {
      removeStub.resolves(undefined)
      notFoundStub.returns(testError)

      return target.deleteGroup(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          removeStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Group Not Found for requested id')
      })
    })

    it('returns resolved promise with data on success', () => {
      removeStub.resolves(testData)

      return target.deleteGroup(7, tx).then((r) => {
        r.should.equal(testData)
        sinon.assert.calledWith(
          removeStub,
          7,
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })
  })

  describe('deleteGroupsForExperimentId', () => {
    it('returns rejected promise when getExperimentById fails', () => {
      getExperimentByIdStub.rejects(testError)
      return target.deleteGroupsForExperimentId(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          getExperimentByIdStub,
          7,
          sinon.match.same(tx))
        sinon.assert.notCalled(removeByExperimentIdStub)
      })
    })

    it('returns rejected promise when getByExperimentId fails', () => {
      getExperimentByIdStub.resolves()
      removeByExperimentIdStub.rejects(testError)

      return target.deleteGroupsForExperimentId(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          getExperimentByIdStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(
          removeByExperimentIdStub,
          7,
          sinon.match.same(tx))
      })
    })

    it('returns resolved promise from getByExperimentId method upon success', () => {
      getExperimentByIdStub.resolves()
      removeByExperimentIdStub.resolves(testData)

      return target.deleteGroupsForExperimentId(7, tx).then((data) => {
        data.should.equal(testData)
        sinon.assert.calledWith(
          getExperimentByIdStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(
          removeByExperimentIdStub,
          7,
          sinon.match.same(tx))
      })
    })
  })
})