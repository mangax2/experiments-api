const AppError = require('../../src/services/utility/AppError')
const sinon = require('sinon')
const UnitSpecificationDetailValidator = require('../../src/validations/UnitSpecificationDetailValidator')

describe('UnitSpecificationDetailValidator', () => {
    const target = new UnitSpecificationDetailValidator()
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
                UnitSpecificationDetailValidator.POST_VALIDATION_SCHEMA)
        })

        it('returns put schema when operation name is PUT', () => {
            target.getSchema('PUT').should.deep.equal(
                UnitSpecificationDetailValidator.POST_VALIDATION_SCHEMA
                    .concat(UnitSpecificationDetailValidator.PUT_ADDITIONAL_SCHEMA_ELEMENTS))
        })
    })

    describe('entityName', () => {
        it('returns name of the entity', () => {
            target.getEntityName().should.equal('UnitSpecificationDetail')
        })
    })

    describe('getBusinessKeyPropertyNames', () => {
        it('returns array of property names for the business key', () => {
            target.getBusinessKeyPropertyNames().should.eql(['experimentId', 'refUnitSpecId'])
        })
    })

    describe('getDuplicateBusinessKeyError', () => {
        it('returns duplicate error message string', () => {
            target.getDuplicateBusinessKeyError().should.eql(
                'Duplicate unit specification id in request payload with same experiment id')
        })
    })

    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Unit specification detail request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Unit specification detail request object needs to be an array')
            })
        })

        it('returns resolved promise when input is a populated array.' , () => {
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
            getBusinessKeyPropertyNamesStub.returns(['experimentId','name'])
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
                        refUnitSpecId: 1,
                        experimentId:2

                    },
                    {
                        refUnitSpecId: 1,
                        experimentId:3
                    }
                ]
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
                        refUnitSpecId: 1,
                        experimentId:2
                    },
                    {
                        refUnitSpecId: 1,
                        experimentId:2
                    }
                ]
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