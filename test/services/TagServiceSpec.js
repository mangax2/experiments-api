import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
const sinon = require('sinon')
const TagService = require('../../src/services/TagService')
const db = require('../../src/db/DbManager')

describe('TagService Specs', () => {

  let target

  const testTags = []
  const testData = {}
  const testPostResponse = {}
  const testError = {}
  const testContext = {}
  const tx = { tx: {} }

  let createPostResponseStub
  let createPutResponseStub
  let notFoundStub
  let validateStub
  let findStub
  let batchFindStub
  let findByExperimentIdStub
  let batchCreateStub
  let batchUpdateStub
  let removeStub
  let batchRemoveStub
  let removeByExperimentIdStub

  before(() => {
    target = new TagService()

    createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
    createPutResponseStub = sinon.stub(AppUtil, 'createPutResponse')
    notFoundStub = sinon.stub(AppError, 'notFound')
    validateStub = sinon.stub(target._validator, 'validate')
    findStub = sinon.stub(db.tag, 'find')
    batchFindStub = sinon.stub(db.tag, 'batchFind')
    findByExperimentIdStub = sinon.stub(db.tag, 'findByExperimentId')
    batchCreateStub = sinon.stub(db.tag, 'batchCreate')
    batchUpdateStub = sinon.stub(db.tag, 'batchUpdate')
    removeStub = sinon.stub(db.tag, 'remove')
    batchRemoveStub = sinon.stub(db.tag, 'batchRemove')
    removeByExperimentIdStub = sinon.stub(db.tag, 'removeByExperimentId')
  })

  afterEach(() => {
    createPostResponseStub.reset()
    createPutResponseStub.reset()
    notFoundStub.reset()
    validateStub.reset()
    findStub.reset()
    batchFindStub.reset()
    findByExperimentIdStub.reset()
    batchCreateStub.reset()
    batchUpdateStub.reset()
    removeStub.reset()
    batchRemoveStub.reset()
    removeByExperimentIdStub.reset()
  })

  after(() => {
    createPostResponseStub.restore()
    createPutResponseStub.restore()
    notFoundStub.restore()
    validateStub.restore()
    findStub.restore()
    batchFindStub.restore()
    findByExperimentIdStub.restore()
    batchCreateStub.restore()
    batchUpdateStub.restore()
    removeStub.restore()
    batchRemoveStub.restore()
    removeByExperimentIdStub.restore()
  })

  describe('batchCreateTags', () => {
    it('returns rejected promise when validate fails', () => {
      validateStub.rejects(testError)

      return target.batchCreateTags(testTags, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testTags),
          'POST')
        sinon.assert.notCalled(batchCreateStub)
        sinon.assert.notCalled(createPostResponseStub)
      })
    })

    it('returns rejected promise when batchCreate fails', () => {
      validateStub.resolves()
      batchCreateStub.rejects(testError)

      return target.batchCreateTags(testTags, testContext, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testTags),
          'POST',
          sinon.match.same(tx))
        sinon.assert.calledWith(batchCreateStub,
          sinon.match.same(testTags),
          sinon.match.same(testContext),
          sinon.match.same(tx))
        sinon.assert.notCalled(createPostResponseStub)
      })
    })

    it('returns resolved promise with data when all calls are success', () => {
      validateStub.resolves()
      batchCreateStub.resolves(testData)
      createPostResponseStub.returns(testPostResponse)

      return target.batchCreateTags(testTags, tx).then((r) => {
        r.should.equal(testPostResponse)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testTags),
          'POST')
        sinon.assert.calledWith(batchCreateStub,
          sinon.match.same(testTags),
          sinon.match.same(tx))
        sinon.assert.calledWith(createPostResponseStub,
          sinon.match.same(testData))
      })
    })
  })

  describe('getTagsByExperimentId', () => {
    it('returns rejected promise when findByExperimentId fails', () => {
      findByExperimentIdStub.rejects(testError)

      return target.getTagsByExperimentId(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          findByExperimentIdStub,
          7,
          sinon.match.same(tx))
      })
    })

    it('returns resolved promise from getByExperimentId method upon success', () => {
      findByExperimentIdStub.resolves(testData)

      return target.getTagsByExperimentId(7, tx).then((data) => {
        data.should.equal(testData)
        sinon.assert.calledWith(
          findByExperimentIdStub,
          7,
          sinon.match.same(tx))
      })
    })
  })

  describe('getTagById', () => {
    it('returns rejected promise when find fails', () => {
      findStub.rejects(testError)

      return target.getTagById(7, tx).should.be.rejected.then((err) => {
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

      return target.getTagById(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          findStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Tag Not Found for requested id')
      })
    })

    it('returns rejected promise when data is undefined', () => {
      findStub.resolves(undefined)
      notFoundStub.returns(testError)

      return target.getTagById(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          findStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Tag Not Found for requested id')
      })
    })

    it('returns resolved promise with data on success', () => {
      findStub.resolves(testData)

      return target.getTagById(7, tx).then((r) => {
        r.should.equal(testData)
        sinon.assert.calledWith(
          findStub,
          7,
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })
  })

  describe('batchGetTagByIds', () => {
    it('returns rejected promise when batchFind fails', () => {
      batchFindStub.rejects(testError)

      return target.batchGetTagByIds([7], tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          batchFindStub,
          [7],
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })

    it('returns resolved promise when data found for all ids', () => {
      const findResult = [{}, {}, {}]
      batchFindStub.resolves(findResult)

      return target.batchGetTagByIds([1, 2, 3], tx).then((r) => {
        r.should.equal(findResult)
        sinon.assert.calledWith(
          batchFindStub,
          [1, 2, 3],
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })
  })

  describe('batchUpdateTags', () => {
    it('returns rejected promise when validate fails', () => {
      validateStub.rejects(testError)

      return target.batchUpdateTags(testTags, testContext, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testTags),
          'PUT',
          sinon.match.same(tx))
        sinon.assert.notCalled(batchUpdateStub)
        sinon.assert.notCalled(createPutResponseStub)
      })
    })

    it('returns rejected promise when batchUpdate fails', () => {
      validateStub.resolves()
      batchUpdateStub.rejects(testError)

      return target.batchUpdateTags(testTags, testContext, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testTags),
          'PUT',
          sinon.match.same(tx))
        sinon.assert.calledWith(batchUpdateStub,
          sinon.match.same(testTags),
          sinon.match.same(testContext),
          sinon.match.same(tx))
        sinon.assert.notCalled(createPutResponseStub)
      })
    })

    it('returns resolved promise with data when all calls are success', () => {
      validateStub.resolves()
      batchUpdateStub.resolves(testData)
      createPutResponseStub.returns(testPostResponse)

      return target.batchUpdateTags(testTags, testContext, tx).then((r) => {
        r.should.equal(testPostResponse)
        sinon.assert.calledWith(validateStub,
          sinon.match.same(testTags),
          'PUT',
          sinon.match.same(tx))
        sinon.assert.calledWith(batchUpdateStub,
          sinon.match.same(testTags),
          sinon.match.same(testContext),
          sinon.match.same(tx))
        sinon.assert.calledWith(createPutResponseStub,
          sinon.match.same(testData))
      })
    })
  })

  describe('deleteTag', () => {
    it('returns rejected promise when remove fails', () => {
      removeStub.rejects(testError)

      return target.deleteTag(7, tx).should.be.rejected.then((err) => {
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

      return target.deleteTag(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          removeStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Tag Not Found for requested id')
      })
    })

    it('returns rejected promise when data is undefined', () => {
      removeStub.resolves(undefined)
      notFoundStub.returns(testError)

      return target.deleteTag(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          removeStub,
          7,
          sinon.match.same(tx))
        sinon.assert.calledWith(notFoundStub, 'Tag Not Found for requested id')
      })
    })

    it('returns resolved promise with data on success', () => {
      removeStub.resolves(testData)

      return target.deleteTag(7, tx).then((r) => {
        r.should.equal(testData)
        sinon.assert.calledWith(
          removeStub,
          7,
          sinon.match.same(tx))
        sinon.assert.notCalled(notFoundStub)
      })
    })
  })

  describe('batchDeleteTags', () => {
    it('returns rejected promise when batchRemove fails', () => {
      batchRemoveStub.rejects(testError)

      return target.batchDeleteTags([1], tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledOnce(batchRemoveStub)
        sinon.assert.calledWithExactly(
          batchRemoveStub,
          [1],
          sinon.match.same(tx),
        )
      })
    })

    it('returns resolved promise when an element is found for each id', () => {
      const removalResult = [{}, {}, {}]
      batchRemoveStub.resolves(removalResult)
      notFoundStub.returns(testError)

      return target.batchDeleteTags([1, 2, 3], tx).then((data) => {
        data.should.equal(removalResult)
        sinon.assert.calledOnce(batchRemoveStub)
        sinon.assert.calledWithExactly(
          batchRemoveStub,
          [1, 2, 3],
          sinon.match.same(tx),
        )
        sinon.assert.notCalled(notFoundStub)
      })
    })
  })

  describe('deleteTagsForExperimentId', () => {
    it('returns rejected promise when removeByExperimentId fails', () => {
      removeByExperimentIdStub.rejects(testError)

      return target.deleteTagsForExperimentId(7, tx).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWith(
          removeByExperimentIdStub,
          7,
          sinon.match.same(tx))
      })
    })

    it('returns resolved promise from removeByExperimentId method upon success', () => {
      removeByExperimentIdStub.resolves(testData)

      return target.deleteTagsForExperimentId(7, tx).then((data) => {
        data.should.equal(testData)
        sinon.assert.calledWith(
          removeByExperimentIdStub,
          7,
          sinon.match.same(tx))
      })
    })
  })
})