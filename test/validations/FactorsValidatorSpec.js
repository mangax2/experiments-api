const AppError = require('../../src/services/utility/AppError')
const sinon = require('sinon')
const FactorsValidator = require('../../src/validations/FactorsValidator')

describe('FactorsValidator', () => {
    const target = new FactorsValidator()
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
                FactorsValidator.POST_VALIDATION_SCHEMA)
        })

        it('returns put schema when operation name is PUT', () => {
            target.getSchema('PUT').should.deep.equal(
                FactorsValidator.POST_VALIDATION_SCHEMA
                    .concat(FactorsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS))
        })
    })


    describe('entityName', () => {
        it('returns name of the entity', () => {
            target.getEntityName().should.equal('Factor')
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
                'Duplicate factor name in request payload with same experiment id')
        })
    })

    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Factor request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Factor request object needs to be an array')
            })
        })

        it('returns resolved promise when input is array.' , () => {
            return target.preValidate([{}]).then(() => {
                sinon.assert.notCalled(badRequestStub)
            })
        })
    })
})