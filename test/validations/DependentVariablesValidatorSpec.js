const sinon = require('sinon')
const DependentVariablesValidator = require('../../src/validations/DependentVariablesValidator')
const ReferentialIntegrityService = require('../../src/services/ReferentialIntegrityService')

const AppError = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'

describe('DependentVariablesValidator', () => {
  const target = new DependentVariablesValidator()
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

  const schemaArrayForPostOperation = [
    { 'paramName': 'required', 'type': 'boolean', 'required': true },
    {
      'paramName': 'name',
      'type': 'text',
      'lengthRange': { 'min': 1, 'max': 500 },
      'required': true,
    },
    { 'paramName': 'experimentId', 'type': 'numeric', 'required': true },
    { 'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments },
    {
      'paramName': 'DependentVariable',
      'type': 'businessKey',
      'keys': ['experimentId', 'name'],
      'entity': db.dependentVariable,
    },
  ]

  const schemaArrayForPutOperation = schemaArrayForPostOperation.concat([{
    'paramName': 'id',
    'type': 'numeric',
    'required': true,
  },
    { 'paramName': 'id', 'type': 'refData', 'entity': db.dependentVariable }])

  describe('getSchema', () => {
    it('returns schema array for POST operation', () => {
      target.getSchema('POST').should.eql(schemaArrayForPostOperation)
    })
    it('returns schema array for PUT operation', () => {
      target.getSchema('PUT').should.eql(schemaArrayForPutOperation)
    })
    it('returns schema array for invalid operation', () => {
      (() =>
          target.getSchema('test')
      ).should.throw()
    })
  })

  describe('entityName', () => {
    it('returns name of the entity', () => {
      target.getEntityName().should.equal('DependentVariable')
    })
  })

  describe('getBusinessKeyPropertyNames', () => {
    it('returns array of property names for the business key', () => {
      target.getBusinessKeyPropertyNames().should.eql(['experimentId', 'name'])
    })
  })

  describe('getDuplicateBusinessKeyError', () => {
    it('returns duplicate error message string', () => {
      target.getDuplicateBusinessKeyError().should.eql(
        'duplicate dependent variable name in request payload with same experiment id')
    })
  })

  describe('preValidate', () => {
    it('returns rejected promise when input is not an array.', () => {
      return target.preValidate({}).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          badRequestStub,
          'Dependent Variables request object needs to be an array')
      })
    })

    it('returns rejected promise when input is empty array.', () => {
      return target.preValidate([]).should.be.rejected.then((err) => {
        err.should.equal(testError)
        sinon.assert.calledWithExactly(
          badRequestStub,
          'Dependent Variables request object needs to be an array')
      })
    })

    it('returns resolved promise when input is array.', () => {
      return target.preValidate([{}]).then(() => {
        sinon.assert.notCalled(badRequestStub)
      })
    })
  })

  describe('postValidate', () => {
    let hasErrorsStub
    let getBusinessKeyPropertyNamesStub
    let getDuplicateBusinessKeyErrorStub

    before(() => {
      hasErrorsStub = sinon.stub(target, 'hasErrors')
      getBusinessKeyPropertyNamesStub = sinon.stub(target, 'getBusinessKeyPropertyNames')
      getDuplicateBusinessKeyErrorStub = sinon.stub(target, 'getDuplicateBusinessKeyError')
      getBusinessKeyPropertyNamesStub.returns(['experimentId', 'name'])

      // badRequestStub = sinon.stub(AppError, 'badRequest')
    })

    afterEach(() => {
      hasErrorsStub.reset()
      getBusinessKeyPropertyNamesStub.reset()
      getDuplicateBusinessKeyErrorStub.reset()
    })

    after(() => {
      hasErrorsStub.restore()
      getBusinessKeyPropertyNamesStub.restore()
      getDuplicateBusinessKeyErrorStub.restore()
    })

    it('does nothing and returns resolved promise when there are errors', () => {
      hasErrorsStub.returns(true)
      const r = target.postValidate({})
      r.should.be.instanceof(Promise)
      return r.then(() => {
        sinon.assert.notCalled(getBusinessKeyPropertyNamesStub)
        sinon.assert.notCalled(getDuplicateBusinessKeyErrorStub)
        sinon.assert.notCalled(badRequestStub)
      })
    })

    it('returns resolved promise when there are no duplicate keys', () => {
      hasErrorsStub.returns(false)
      const r = target.postValidate(
        [
          {
            name: 'A',
            experimentId: 2,

          },
          {
            name: 'B',
            experimentId: 3,
          },
        ],
      )

      r.should.be.instanceof(Promise)
      return r.then(() => {
        sinon.assert.calledOnce(getBusinessKeyPropertyNamesStub)
        sinon.assert.notCalled(getDuplicateBusinessKeyErrorStub)
        sinon.assert.notCalled(badRequestStub)
      })
    })

    it('returns resolved promise when there are no duplicate keys', () => {
      hasErrorsStub.returns(false)
      const r = target.postValidate(
        [
          {
            name: 'A',
            experimentId: 2,

          },
          {
            name: 'B',
            experimentId: 3,
          },
        ],
      )

      r.should.be.instanceof(Promise)
      return r.then(() => {
        sinon.assert.calledOnce(getBusinessKeyPropertyNamesStub)
        sinon.assert.notCalled(getDuplicateBusinessKeyErrorStub)
        sinon.assert.notCalled(badRequestStub)
      })
    })

    it('returns error message when there are duplicate keys', () => {
      hasErrorsStub.returns(false)
      getDuplicateBusinessKeyErrorStub.returns('Error message')

      const r = target.postValidate(
        [
          {
            name: 'A',
            experimentId: 2,
          },
          {
            name: 'A',
            experimentId: 2,
          },
        ],
      )

      r.should.be.instanceof(Promise)
      return r.then(() => {
        sinon.assert.calledOnce(getBusinessKeyPropertyNamesStub)
        sinon.assert.calledOnce(getDuplicateBusinessKeyErrorStub)
        target.messages.should.eql(['Error message'])

      })
    })
  })

})

