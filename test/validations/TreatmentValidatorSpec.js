const AppError = require('../../src/services/utility/AppError')
const sinon = require('sinon')
const TreatmentValidator = require('../../src/validations/TreatmentValidator')

describe('TreatmentValidator', () => {
    const target = new TreatmentValidator()
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
                TreatmentValidator.POST_VALIDATION_SCHEMA)
        })

        it('returns put schema when operation name is PUT', () => {
            target.getSchema('PUT').should.deep.equal(
                TreatmentValidator.POST_VALIDATION_SCHEMA
                    .concat(TreatmentValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS))
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
                'Duplicate treatment name in request payload with same experiment id')
        })
    })

    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Treatment request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Treatment request object needs to be an array')
            })
        })

        it('returns resolved promise when input is a populated array.' , () => {
            return target.preValidate([{}]).then(() => {
                sinon.assert.notCalled(badRequestStub)
            })
        })
    })
})