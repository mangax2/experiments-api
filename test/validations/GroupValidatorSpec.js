const AppError = require('../../src/services/utility/AppError')
const sinon = require('sinon')
const GroupValidator = require('../../src/validations/GroupValidator')
const SchemaValidator = require('../../src/validations/SchemaValidator')
const HttpUtil = require('../../src/services/utility/HttpUtil')
const PingUtil = require('../../src/services/utility/PingUtil')

describe('GroupValidator', () => {
  const target = new GroupValidator()
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

  describe('getSchema', () => {
    it('returns post schema when operation name is POST', () => {
      target.getSchema('POST').should.deep.equal(
        GroupValidator.POST_VALIDATION_SCHEMA)
    })

    it('returns put schema when operation name is PUT', () => {
      target.getSchema('PUT').should.deep.equal(
        GroupValidator.POST_VALIDATION_SCHEMA
          .concat(GroupValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS))
    })

    it('returns put schema when operation name is invalid', () => {
      (() =>
          target.getSchema('test')
      ).should.throw()
    })
  })

  describe('entityName', () => {
    it('returns name of the entity', () => {
      target.getEntityName().should.equal('Group')
    })
  })

  describe('preValidate', () => {
    it('returns rejected promise when input is not an array.', () => {
      return target.preValidate({}).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          badRequestStub,
          'Group request object needs to be an array')
      })
    })

    it('returns rejected promise when input is empty array.', () => {
      return target.preValidate([]).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          badRequestStub,
          'Group request object needs to be an array')
      })
    })

    it('returns resolved promise when input is a populated array.', () => {
      return target.preValidate([{}]).then(() => {
        sinon.assert.notCalled(badRequestStub)
      })
    })
  })

  describe('postValidate ', () => {
    let validateRandomizationStrategyIdsStub
    let getValidRandomizationIdsStub

    before(() => {
      validateRandomizationStrategyIdsStub = sinon.stub(target, 'validateRandomizationStrategyIds', () => Promise.resolve(5))
      getValidRandomizationIdsStub = sinon.stub(target, 'getValidRandomizationIds', () => {target.strategyRetrievalPromise = Promise.resolve()})
    })

    afterEach(() => {
      validateRandomizationStrategyIdsStub.reset()
      getValidRandomizationIdsStub.reset()
    })

    after(() => {
      validateRandomizationStrategyIdsStub.restore()
      getValidRandomizationIdsStub.restore()
    })

    it('does not call getValidRanomizationIds if strategyRetrievalPromise exists', () => {
      target.strategyRetrievalPromise = Promise.resolve()
      
      return target.postValidate().then((result) => {
        result.should.equal(5)
        sinon.assert.notCalled(getValidRandomizationIdsStub)
        sinon.assert.called(validateRandomizationStrategyIdsStub)
      })
    })

    it('does call getValidRanomizationIds if strategyRetrievalPromise does not exists', () => {
      target.strategyRetrievalPromise = undefined
      
      return target.postValidate().then((result) => {
        result.should.equal(5)
        sinon.assert.called(getValidRandomizationIdsStub)
        sinon.assert.called(validateRandomizationStrategyIdsStub)
      })
    })
  })

  describe('validateRandomizationStrategyIds', () => {
    it('resolves if there are only null refRandomizationStrategyIds', () => {
      const groups = [{refRandomizationStrategyId: null}, {refRandomizationStrategyId: null}]
      target.validRandomizationIds = [1,2,3]

      return target.validateRandomizationStrategyIds(groups)
    })

    it('call badRequest with bad strategy ids', () => {
      const groups = [{refRandomizationStrategyId: 1}, {refRandomizationStrategyId: 5}]
      target.validRandomizationIds = [1,2,3]

      return target.validateRandomizationStrategyIds(groups).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          badRequestStub,
          'Invalid randomization strategy ids: 5')
      })
    })

    it('resolves if all ids match', () => {
      const groups = [{refRandomizationStrategyId: 1}, {refRandomizationStrategyId: 2}]
      target.validRandomizationIds = [1,2,3]

      return target.validateRandomizationStrategyIds(groups)
    })
  })

  describe('getValidRandomizationIds', () => {
    let getMonsantoHeaderStub
    let getStub
    let getErrorMessageForLogsStub

    before(() => {
      getMonsantoHeaderStub = sinon.stub(PingUtil, 'getMonsantoHeader')
      getStub = sinon.stub(HttpUtil, 'get')
      getErrorMessageForLogsStub = sinon.stub(HttpUtil, 'getErrorMessageForLogs', () => '')
    })
    beforeEach(() => {
      target.strategyRetrievalPromise = undefined
      target.validRandomizationIds = undefined
      getMonsantoHeaderStub.resolves('header')
    })

    afterEach(() => {
      getMonsantoHeaderStub.reset()
      getStub.reset()
      getErrorMessageForLogsStub.reset()
    })

    after(() => {
      getMonsantoHeaderStub.restore()
      getStub.restore()
      getErrorMessageForLogsStub.restore()
    })

    it('rejects the strategyRetrievalPromise if the get fails', () => {
      getStub.rejects('error')
      const resultingPromise = target.getValidRandomizationIds()
      const strategyRetrievalPromise = target.strategyRetrievalPromise

      return resultingPromise.then(() => {
        strategyRetrievalPromise.should.be.rejected.then(() => {
          err.should.equal(testError)
          sinon.assert.calledWithExactly(
            badRequestStub,
            'Unable to validate randomization strategy ids.')
        })
        sinon.assert.called(getMonsantoHeaderStub)
        sinon.assert.called(getErrorMessageForLogsStub)
        sinon.assert.match(target.strategyRetrievalPromise, undefined)
      })
    })

    it('maps the valid ids if the body exists', () => {
      getStub.resolves({
        body: [
          {id: 1},
          {id: 3},
          {id: 8},
        ],
      })
      const resultingPromise = target.getValidRandomizationIds()
      const strategyRetrievalPromise = target.strategyRetrievalPromise

      return resultingPromise.then(() => {
        strategyRetrievalPromise.should.be.rejected.then(() => {
          err.should.equal(testError)
          sinon.assert.calledWithExactly(
            badRequestStub,
            'Unable to validate randomization strategy ids.')
        })
        sinon.assert.called(getMonsantoHeaderStub)
        sinon.assert.notCalled(getErrorMessageForLogsStub)
        sinon.assert.match(target.validRandomizationIds, [1, 3, 8])
        sinon.assert.match(target.strategyRetrievalPromise, strategyRetrievalPromise)
      })
    })
    
    it('resolves the strategyRetrievalPromise without mapping if no body', () => {
      getStub.resolves({})
      const resultingPromise = target.getValidRandomizationIds()
      const strategyRetrievalPromise = target.strategyRetrievalPromise

      return resultingPromise.then(() => {
        strategyRetrievalPromise.should.be.rejected.then(() => {
          err.should.equal(testError)
          sinon.assert.calledWithExactly(
            badRequestStub,
            'Unable to validate randomization strategy ids.')
        })
        sinon.assert.called(getMonsantoHeaderStub)
        sinon.assert.notCalled(getErrorMessageForLogsStub)
        sinon.assert.match(target.validRandomizationIds, undefined)
        sinon.assert.match(target.strategyRetrievalPromise, strategyRetrievalPromise)
      })
    })

    it('rejects the strategyRetrievalPromise if unable to retrieve a header', () => {
      getMonsantoHeaderStub.resetBehavior()
      getMonsantoHeaderStub.rejects()
      getStub.resolves({})
      const resultingPromise = target.getValidRandomizationIds()
      const strategyRetrievalPromise = target.strategyRetrievalPromise

      return resultingPromise.then(() => {
        strategyRetrievalPromise.should.be.rejected.then(() => {
          err.should.equal(testError)
          sinon.assert.calledWithExactly(
            badRequestStub,
            'Unable to validate randomization strategy ids.')
        })
        sinon.assert.called(getMonsantoHeaderStub)
        sinon.assert.called(getErrorMessageForLogsStub)
        sinon.assert.notCalled(getStub)
        sinon.assert.match(target.strategyRetrievalPromise, undefined)
      })
    })
  })
})