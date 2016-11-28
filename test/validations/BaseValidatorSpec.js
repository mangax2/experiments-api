const sinon = require('sinon')
const chai = require('chai')
const BaseValidator = require('../../src/validations/BaseValidator')
const ReferentialIntegrityService = require('../../src/services/ReferentialIntegrityService')
const AppError = require('../../src/services/utility/AppError')

describe('BaseValidator', () => {
    const target = new BaseValidator()

    const testError = {}
    const testTransaction = {}
    const testResponse = {}

    let riFindStub
    let riFindByBusnessKeyStub

    before(() => {
        riFindStub = sinon.stub(target.referentialIntegrityService, 'getById')
        riFindByBusnessKeyStub = sinon.stub(target.referentialIntegrityService, 'getByBusinessKey')

    })

    after(() => {
        riFindStub.restore()
        riFindByBusnessKeyStub.restore()
    })

    afterEach(() => {
        target.messages = []
    })

    describe('hasErrors', () => {
        it('returns false when there are no messages', () => {
            target.hasErrors().should.be.false
        })

        it('returns true when there are messages', () => {
            target.messages.push('blah')
            target.hasErrors().should.be.true
        })
    })

    describe('_validateArray', () => {
        let validateEntityStub

        before(() => {
            validateEntityStub = sinon.stub(target, 'validateEntity')
        })

        afterEach(() => {
            validateEntityStub.reset()
        })

        after(() => {
            validateEntityStub.restore()
        })

        it('returns rejected promise when one validation returns rejected promise', () => {
            const element1 = {}
            validateEntityStub.rejects(testError)

            return target._validateArray([element1], 'opName', testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                validateEntityStub.callCount.should.eql(1)
                sinon.assert.calledWithExactly(
                    validateEntityStub,
                    sinon.match.same(element1),
                    'opName',
                    sinon.match.same(testTransaction)
                )
            })
        })

        it('returns rejected promise when one validation of many returns rejected promise', () => {
            const element1 = {}
            const element2 = {}
            validateEntityStub.onFirstCall().rejects(testError)
            validateEntityStub.onSecondCall().resolves()

            return target._validateArray([element1, element2], 'opName', testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                validateEntityStub.callCount.should.eql(2)
                sinon.assert.calledWithExactly(
                    validateEntityStub,
                    sinon.match.same(element1),
                    'opName',
                    sinon.match.same(testTransaction)
                )
                sinon.assert.calledWithExactly(
                    validateEntityStub,
                    sinon.match.same(element2),
                    'opName',
                    sinon.match.same(testTransaction)
                )
            })
        })

        it('returns resolved promise when all pass', () => {
            const element1 = {}
            const element2 = {}
            validateEntityStub.onFirstCall().resolves()
            validateEntityStub.onSecondCall().resolves()

            return target._validateArray([element1, element2], 'opName', testTransaction).then(() => {
                validateEntityStub.callCount.should.eql(2)
                sinon.assert.calledWithExactly(
                    validateEntityStub,
                    sinon.match.same(element1),
                    'opName',
                    sinon.match.same(testTransaction)
                )
                sinon.assert.calledWithExactly(
                    validateEntityStub,
                    sinon.match.same(element2),
                    'opName',
                    sinon.match.same(testTransaction)
                )
            })
        })
    })

    describe('_validateArrayOrSingleEntity', () => {
        let validateArrayStub
        let validateEntityStub

        before(() => {
            validateArrayStub = sinon.stub(target, '_validateArray')
            validateEntityStub = sinon.stub(target, 'validateEntity')
        })

        afterEach(() => {
            validateArrayStub.reset()
            validateEntityStub.reset()
        })

        after(() => {
            validateArrayStub.restore()
            validateEntityStub.restore()
        })

        it('calls _validateArray for array', () => {
            const entities = []
            validateArrayStub.returns(testResponse)

            const r = target._validateArrayOrSingleEntity(entities, 'opName', testTransaction)

            r.should.equal(testResponse)
            sinon.assert.calledWithExactly(
                validateArrayStub,
                sinon.match.same(entities),
                'opName',
                sinon.match.same(testTransaction)
            )
            sinon.assert.notCalled(validateEntityStub)
        })

        it('calls validateEntity for non array', () => {
            const entity = {}
            validateEntityStub.returns(testResponse)

            const r = target._validateArrayOrSingleEntity(entity, 'opName', testTransaction)

            r.should.equal(testResponse)
            sinon.assert.calledWithExactly(
                validateEntityStub,
                sinon.match.same(entity),
                'opName',
                sinon.match.same(testTransaction)
            )
            sinon.assert.notCalled(validateArrayStub)
        })
    })

    describe('validate', () => {
        const testInput = {}
        let preValidateStub
        let validateArrayorSingleEntityStub
        let postValidateStub
        let checkStub

        before(() => {
            preValidateStub = sinon.stub(target, 'preValidate')
            validateArrayorSingleEntityStub = sinon.stub(target, '_validateArrayOrSingleEntity')
            postValidateStub = sinon.stub(target, 'postValidate')
            checkStub = sinon.stub(target, 'check')
        })

        afterEach(() => {
            preValidateStub.reset()
            validateArrayorSingleEntityStub.reset()
            postValidateStub.reset()
            checkStub.reset()
        })

        after(() => {
            preValidateStub.restore()
            validateArrayorSingleEntityStub.reset()
            postValidateStub.restore()
            checkStub.restore()
        })

        it('returns rejected promise when preValidate fails', () => {
            preValidateStub.rejects(testError)

            return target.validate(testInput, 'opName', testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    preValidateStub,
                    sinon.match.same(testInput))
                sinon.assert.notCalled(validateArrayorSingleEntityStub)
                sinon.assert.notCalled(postValidateStub)
                sinon.assert.notCalled(checkStub)
            })
        })

        it('returns rejected promise when _validateArrayOrSingleEntity fails', () => {
            preValidateStub.resolves()
            validateArrayorSingleEntityStub.rejects(testError)

            return target.validate(testInput, 'opName', testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    preValidateStub,
                    sinon.match.same(testInput))
                sinon.assert.calledWithExactly(
                    validateArrayorSingleEntityStub,
                    sinon.match.same(testInput),
                    'opName',
                    sinon.match.same(testTransaction))
                sinon.assert.notCalled(postValidateStub)
                sinon.assert.notCalled(checkStub)
            })
        })

        it('returns rejected promise when postValidate fails', () => {
            preValidateStub.resolves()
            validateArrayorSingleEntityStub.resolves()
            postValidateStub.rejects(testError)

            return target.validate(testInput, 'opName', testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    preValidateStub,
                    sinon.match.same(testInput))
                sinon.assert.calledWithExactly(
                    validateArrayorSingleEntityStub,
                    sinon.match.same(testInput),
                    'opName',
                    sinon.match.same(testTransaction))
                sinon.assert.calledWithExactly(
                    postValidateStub,
                    sinon.match.same(testInput))
                sinon.assert.notCalled(checkStub)
            })
        })

        it('returns rejected promise when check fails', () => {
            preValidateStub.resolves()
            validateArrayorSingleEntityStub.resolves()
            postValidateStub.resolves()
            checkStub.rejects(testError)

            return target.validate(testInput, 'opName', testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    preValidateStub,
                    sinon.match.same(testInput))
                sinon.assert.calledWithExactly(
                    validateArrayorSingleEntityStub,
                    sinon.match.same(testInput),
                    'opName',
                    sinon.match.same(testTransaction))
                sinon.assert.calledWithExactly(
                    postValidateStub,
                    sinon.match.same(testInput))
                sinon.assert.calledOnce(checkStub)
            })
        })

        it('returns resolved promise when all succeed', () => {
            preValidateStub.resolves()
            validateArrayorSingleEntityStub.resolves()
            postValidateStub.resolves()
            checkStub.resolves(testResponse)

            return target.validate(testInput, 'opName', testTransaction).then((r) => {
                r.should.equal(testResponse)
                sinon.assert.calledWithExactly(
                    preValidateStub,
                    sinon.match.same(testInput))
                sinon.assert.calledWithExactly(
                    validateArrayorSingleEntityStub,
                    sinon.match.same(testInput),
                    'opName',
                    sinon.match.same(testTransaction))
                sinon.assert.calledWithExactly(
                    postValidateStub,
                    sinon.match.same(testInput))
                sinon.assert.calledOnce(checkStub)
            })
        })
    })

    describe('preValidate', () => {
        it('returns resolved promise', () => {
            return target.preValidate({})
        })
    })

    describe('postValidate', () => {
        it('returns resolved promise', () => {
            return target.postValidate({})
        })
    })

    describe('validateEntity', () => {
        it('returns rejected promise', () => {
            return target.validateEntity({}, 'opName', testTransaction).should.be.rejected
        })
    })

    describe('checkLength ', () => {
        it('returns no error message when value is within length range', () => {
            target.checkLength('testValue', {'min': 1, 'max': 100}, 'param1')
            target.messages.length.should.equal(0)
        })
        it('returns error message when value is not within length range', () => {
            target.checkLength('testValue', {'min': 1, 'max': 2}, 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 length is out of range(min=1 max=2)")
        })

    })

    describe('required check', () => {
        it('returns no error message when value not empty', () => {
            const testObject = new BaseValidator()
            testObject.checkRequired('testValue', 'param1')
            testObject.messages.length.should.equal(0)
        })
        it('returns error when value is null or undefined', () => {
            target.checkRequired(null, 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 is required")

        })

    })

    describe('checkNumeric check', () => {
        it('returns no error message when value not is number', () => {
            const testObject = new BaseValidator()
            testObject.checkNumeric(10, 'param1')
            testObject.messages.length.should.equal(0)

        })

        it('returns error when value is not a number', () => {
            target.checkNumeric('text', 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 must be numeric")

        })

    })


    describe('checkBoolean check', () => {
        it('returns no error message when value is boolean', () => {
            const testObject = new BaseValidator()
            testObject.checkBoolean(true, 'param1')
            testObject.messages.length.should.equal(0)

        })

        it('returns error when value is not boolean', () => {
            target.checkBoolean('text', 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 must be boolean")

        })

    })

    describe('checkNumericRange ', () => {
        it('returns no error message when value is within numeric range', () => {
            target.checkNumericRange(20, {'min': 1, 'max': 100}, 'param1')
            target.messages.length.should.equal(0)
        })
        it('returns error message when value is not within numeric range', () => {
            target.checkNumericRange(20, {'min': 1, 'max': 2}, 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 value is out of numeric range(min=1 max=2)")
        })

    })

    describe('checkConstants check', () => {
        it('returns no error message when value not is valid constant', () => {
            const testObject = new BaseValidator()
            testObject.checkConstants("ACTIVE", ['ACTIVE'], 'param1')
            testObject.messages.length.should.equal(0)
        })

        it('returns error when value is not a valid constant', () => {
            target.checkConstants('ACTIVE1', ['ACTIVE'], 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 requires a valid value")

        })

    })

    describe('checkReferentialIntegrityById', () => {
        let getEntityNameStub

        before(() => {
            getEntityNameStub = sinon.stub(target, 'getEntityName')
        })

        afterEach(() => {
            getEntityNameStub.reset()
        })

        after(() => {
            getEntityNameStub.restore()
        })

        it('returns error message when id not found', () => {
            riFindStub.resolves(undefined)
            getEntityNameStub.returns('entity')
            return target.checkReferentialIntegrityById(1, {}, 'entity').then(()=> {
                target.messages.length.should.equal(1)
                target.messages[0].should.equal("entity not found for id 1")
            })
        })

        it('returns no error message when id  found', () => {
            riFindStub.resolves({id: 1})
            return target.checkReferentialIntegrityById(1, {}, 'entity').then(()=> {
                target.messages.length.should.equal(0)
                sinon.assert.notCalled(getEntityNameStub)
            })
        })
    })

    describe('checkRIBusiness', () => {
        let getEntityNameStub

        before(() => {
            getEntityNameStub = sinon.stub(target, 'getEntityName')
        })

        afterEach(() => {
            getEntityNameStub.reset()
        })

        after(() => {
            getEntityNameStub.restore()
        })

        it('returns error message when dup record found by busness key', () => {
            riFindByBusnessKeyStub.resolves({id: 2})
            getEntityNameStub.returns('entity')
            return target.checkRIBusiness(1, [{}], 'entity', ['k1', 'k2']).then(()=> {
                target.messages.length.should.equal(1)
                target.messages[0].should.equal("entity already exists for given business keys: k1,k2")

            })
        })

        it('returns no error message when dup record not found by busness key', () => {
            riFindByBusnessKeyStub.resolves(undefined)
            return target.checkRIBusiness(1, {}, 'entity', ['k1', 'k2']).then(()=> {
                target.messages.length.should.equal(0)
                sinon.assert.notCalled(getEntityNameStub)
            })
        })

    })

    describe('check', () => {
        let badRequestStub

        before(() => {
            badRequestStub = sinon.stub(AppError, 'badRequest')
        })

        afterEach(() => {
            badRequestStub.reset()
        })

        after(() => {
            badRequestStub.restore()
        })

        it('returns rejected promise when there is an error message', () => {
            badRequestStub.returns(testError)
            target.messages.push('Oh no!')

            return target.check().should.be.rejected.then((err) => {
                err.should.eql([testError])
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Oh no!')
            })
        })

        it('returns resolved promise when there is no error message', () => {
            return target.check().then(() => {
                sinon.assert.notCalled(badRequestStub)
            })
        })
    })


     describe('entityName', () => {
         it('throws error in default implementation', () => {
             (() => {
                 return target.getEntityName()
             }).should.throw('entityName not implemented')
         })
     })

})

