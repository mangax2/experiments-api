const AppError = require('../../src/services/utility/AppError')
const sinon = require('sinon')
const FactorsValidator = require('../../src/validations/FactorsValidator')
const SchemaValidator = require('../../src/validations/SchemaValidator')

describe('FactorsValidator', () => {
    const target = new FactorsValidator()
    const testError = new Error('Test Error')
    let badRequestStub
    let superPerformValidationsStub
    let checkBusinessKeyStub

    before(() => {
        badRequestStub = sinon.stub(AppError, 'badRequest', () => {
            return testError
        })
        superPerformValidationsStub = sinon.stub(SchemaValidator.prototype, 'performValidations')
    })

    afterEach(() => {
        badRequestStub.reset()
        superPerformValidationsStub.reset()
        if (checkBusinessKeyStub) {
            checkBusinessKeyStub.restore()
            checkBusinessKeyStub = null
        }
    })

    after(() => {
        badRequestStub.restore()
        superPerformValidationsStub.restore()
    })

    describe('getSchema', () => {
        it('returns post schema when operation name is POST', () => {
            target.getSchema('POST').should.deep.equal(
                FactorsValidator.POST_VALIDATION_SCHEMA)
        })

        it('returns put schema when operation name is POST', () => {
            target.getSchema('PUT').should.deep.equal(
                FactorsValidator.POST_VALIDATION_SCHEMA
                    .concat(FactorsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS))
        })
    })

    describe('performValidations', () => {
        it('returns rejected promise when parameter is not an array', () => {
            return target.performValidations({}, null).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(badRequestStub, 'Factor request object needs to be an array')
            })
        })

        it('returns rejected promise when call to super performValidations returns rejected promise', () => {
            const testFactor = {}
            superPerformValidationsStub.rejects(testError)
            checkBusinessKeyStub = sinon.stub(target, 'checkBusinessKey')

            return target.performValidations([testFactor], 'opName').should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    superPerformValidationsStub,
                    sinon.match.same(testFactor),
                    'opName')
                sinon.assert.notCalled(checkBusinessKeyStub)
            })
        })

        it('returns rejected promise when call to checkBusinessKey throws an error', () => {
            const testFactor = {}
            const testFactorArray = [testFactor]
            superPerformValidationsStub.resolves()
            checkBusinessKeyStub = sinon.stub(target, 'checkBusinessKey', () => {
                throw testError
            })

            return target.performValidations(testFactorArray, 'opName').should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    superPerformValidationsStub,
                    sinon.match.same(testFactor),
                    'opName')
                sinon.assert.calledWithExactly(
                    checkBusinessKeyStub,
                    sinon.match.same(testFactorArray))
            })
        })

        it('returns resolved promise when everything passes', () => {
            const testFactor = {}
            const testFactorArray = [testFactor]
            superPerformValidationsStub.resolves()
            checkBusinessKeyStub = sinon.stub(target, 'checkBusinessKey')

            return target.performValidations(testFactorArray, 'opName').then(() => {
                sinon.assert.calledWithExactly(
                    superPerformValidationsStub,
                    sinon.match.same(testFactor),
                    'opName')
                sinon.assert.calledWithExactly(
                    checkBusinessKeyStub,
                    sinon.match.same(testFactorArray))
            })
        })
    })

    describe('checkBusinessKey', () => {
        it('throws error when multiple entries have the same business key', () => {
            (() => {
                target.checkBusinessKey(
                    [
                        {
                            experimentId: 1,
                            name: 'notUnique'
                        },
                        {
                            experimentId: 1,
                            name: 'notUnique'
                        }
                    ]
                )
            }).should.throw(testError)

            sinon.assert.calledWithExactly(
                badRequestStub,
                'Duplicate factor name in request payload with same experiment id')
        })

        it('does not throw an error when business key is unique', () => {
            target.checkBusinessKey(
                [
                    {
                        experimentId: 1,
                        name: 'unique1'
                    },
                    {
                        experimentId: 1,
                        name: 'unique2'
                    }
                ]
            )
            sinon.assert.notCalled(badRequestStub)
        })
    })
})