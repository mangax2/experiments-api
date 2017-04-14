const AppError = require('../../src/services/utility/AppError')
const sinon = require('sinon')
const ExperimentalUnitValidator = require('../../src/validations/ExperimentalUnitValidator')
const SchemaValidator = require('../../src/validations/SchemaValidator')

describe('ExperimentalUnitValidator', () => {
  const target = new ExperimentalUnitValidator()
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
        ExperimentalUnitValidator.POST_VALIDATION_SCHEMA)
    })

    it('returns put schema when operation name is POST', () => {
      target.getSchema('PUT').should.deep.equal(
        ExperimentalUnitValidator.POST_VALIDATION_SCHEMA
          .concat(ExperimentalUnitValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS))
    })
  })

  describe('entityName', () => {
    it('returns name of the entity', () => {
      target.getEntityName().should.equal('ExperimentalUnit')
    })
  })

  describe('preValidate', () => {
    it('returns rejected promise when input is not an array.', () => {
      return target.preValidate({}).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          badRequestStub,
          'ExperimentalUnit request object needs to be an array')
      })
    })

    it('returns rejected promise when input is empty array.', () => {
      return target.preValidate([]).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          badRequestStub,
          'ExperimentalUnit request object needs to be an array')
      })
    })

    it('returns resolved promise when input is a populated array.', () => {
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