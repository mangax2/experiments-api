const AppError = require('../../src/services/utility/AppError')
const sinon = require('sinon')
const FactorLevelsValidator = require('../../src/validations/FactorLevelsValidator')
const SchemaValidator = require('../../src/validations/SchemaValidator')

describe('FactorLevelsValidator', () => {
    const target = new FactorLevelsValidator()
    const testError = new Error('Test Error')
    const tx = {tx: {}}

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
                FactorLevelsValidator.POST_VALIDATION_SCHEMA)
        })

        it('returns put schema when operation name is POST', () => {
            target.getSchema('PUT').should.deep.equal(
                FactorLevelsValidator.POST_VALIDATION_SCHEMA
                    .concat(FactorLevelsValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS))
        })
    })

    describe('performValidations', () => {
        it('returns rejected promise when parameter is not an array', () => {
            return target.performValidations({}, null).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(badRequestStub, 'Factor Level request object needs to be an array')
            })
        })

        it('returns rejected promise when call to super performValidations returns rejected promise', () => {
            const testFactor = {}
            superPerformValidationsStub.rejects(testError)
            checkBusinessKeyStub = sinon.stub(target, 'checkBusinessKey')

            return target.performValidations([testFactor], 'opName', tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    superPerformValidationsStub,
                    sinon.match.same(testFactor),
                    'opName',
                    sinon.match.same(tx))
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

            return target.performValidations(testFactorArray, 'opName', tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    superPerformValidationsStub,
                    sinon.match.same(testFactor),
                    'opName',
                    sinon.match.same(tx))
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

            return target.performValidations(testFactorArray, 'opName', tx).then(() => {
                sinon.assert.calledWithExactly(
                    superPerformValidationsStub,
                    sinon.match.same(testFactor),
                    'opName',
                    sinon.match.same(tx))
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
                            factorId: 1,
                            value: 'notUnique'
                        },
                        {
                            factorId: 1,
                            value: 'notUnique'
                        }
                    ]
                )
            }).should.throw(testError)

            sinon.assert.calledWithExactly(
                badRequestStub,
                'Duplicate factor level value in request payload with same factor id')
        })

        it('does not throw an error when business key is unique', () => {
            target.checkBusinessKey(
                [
                    {
                        factorId: 1,
                        value: 'unique1'
                    },
                    {
                        factorId: 1,
                        value: 'unique2'
                    }
                ]
            )
            sinon.assert.notCalled(badRequestStub)
        })
    })
})