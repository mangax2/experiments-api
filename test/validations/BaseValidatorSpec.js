const sinon = require('sinon')
const chai = require('chai')
const BaseValidator = require('../../src/validations/BaseValidator')
const ReferentialIntegrityService = require('../../src/services/ReferentialIntegrityService')
let riFindStub
let riFindByBusnessKeyStub
describe('BaseValidator', () => {
    const testObject = new BaseValidator()
    let baseStub

    before(() => {
        riFindStub = sinon.stub(testObject.referentialIntegrityService, 'getById')
        riFindByBusnessKeyStub = sinon.stub(testObject.referentialIntegrityService, 'getByBusinessKey')

    })

    after(() => {
        riFindStub.restore()
        riFindByBusnessKeyStub.restore()
    })

    afterEach(() => {
        if (baseStub) {
            baseStub.restore()
        }
        testObject.messages = []
    })

    describe('validate', () => {
        it('fails due to not allowing call to performValidations in BaseValidator class', () => {
            return testObject.validate({}).should.be.rejected
        })

        it('returns a check with no messages', () => {
            baseStub = sinon.stub(testObject, 'performValidations').resolves()
            testObject.validate.bind(testObject, {}).should.not.throw()
        })

        it('throws an error with messages', () => {
            baseStub = sinon.stub(testObject, 'performValidations').resolves()
            testObject.messages.push("Test Bad Validation")
            return testObject.validate({}).should.be.rejected.then((err) => {
                err[0].errorMessage.should.equal("Test Bad Validation")
            })
        })
    })

    describe('checkLength ', () => {
        it('returns no error message when value is within length range', () => {
            testObject.checkLength('testValue', {'min': 1, 'max': 100}, 'param1')
            testObject.messages.length.should.equal(0)
        })
        it('returns error message when value is not within length range', () => {
            testObject.checkLength('testValue', {'min': 1, 'max': 2}, 'param1')
            testObject.messages.length.should.equal(1)
            testObject.messages[0].should.equal("param1 length is out of range(min=1 max=2)")
        })

    })

    describe('required check', () => {
        it('returns no error message when value not empty', () => {
            const testObject = new BaseValidator()
            testObject.checkRequired('testValue', 'param1')
            testObject.messages.length.should.equal(0)
        })
        it('returns error when value is null or undefined', () => {
            testObject.checkRequired(null, 'param1')
            testObject.messages.length.should.equal(1)
            testObject.messages[0].should.equal("param1 is required")

        })

    })

    describe('checkNumeric check', () => {
        it('returns no error message when value not is number', () => {
            const testObject = new BaseValidator()
            testObject.checkNumeric(10, 'param1')
            testObject.messages.length.should.equal(0)

        })

        it('returns error when value is not a number', () => {
            testObject.checkNumeric('text', 'param1')
            testObject.messages.length.should.equal(1)
            testObject.messages[0].should.equal("param1 must be numeric")

        })

    })


    describe('checkBoolean check', () => {
        it('returns no error message when value is boolean', () => {
            const testObject = new BaseValidator()
            testObject.checkBoolean(true, 'param1')
            testObject.messages.length.should.equal(0)

        })

        it('returns error when value is not boolean', () => {
            testObject.checkBoolean('text', 'param1')
            testObject.messages.length.should.equal(1)
            testObject.messages[0].should.equal("param1 must be boolean")

        })

    })

    describe('checkNumericRange ', () => {
        it('returns no error message when value is within numeric range', () => {
            testObject.checkNumericRange(20, {'min': 1, 'max': 100}, 'param1')
            testObject.messages.length.should.equal(0)
        })
        it('returns error message when value is not within numeric range', () => {
            testObject.checkNumericRange(20, {'min': 1, 'max': 2}, 'param1')
            testObject.messages.length.should.equal(1)
            testObject.messages[0].should.equal("param1 value is out of numeric range(min=1 max=2)")
        })

    })

    // checkNumericRange(value, numericRange, name){


    describe('checkConstants check', () => {
        it('returns no error message when value not is valid constant', () => {
            const testObject = new BaseValidator()
            testObject.checkConstants("ACTIVE", ['ACTIVE'], 'param1')
            testObject.messages.length.should.equal(0)
        })

        it('returns error when value is not a valid constant', () => {
            testObject.checkConstants('ACTIVE1', ['ACTIVE'], 'param1')
            testObject.messages.length.should.equal(1)
            testObject.messages[0].should.equal("param1 requires a valid value")

        })

    })


    describe('performValidations', () => {
        it('returns error when performValidations is not implemented by subclass ', () => {
            return chai.expect(testObject.performValidations()).to.eventually
                .be.rejectedWith("Server error, please contact support")

        })
    })

    describe('checkReferentialIntegrityById', () => {
        it('returns error message when id not found', () => {
            riFindStub.resolves(undefined)
            return testObject.checkReferentialIntegrityById(1, {}, 'entity').then(()=> {
                testObject.messages.length.should.equal(1)
                testObject.messages[0].should.equal("No entity found with id 1")

            })
        })

        it('returns no error message when id  found', () => {
            riFindStub.resolves({id: 1})
            return testObject.checkReferentialIntegrityById(1, {}, 'entity').then(()=> {
                testObject.messages.length.should.equal(0)
            })
        })


    })

    describe('checkRIBusiness', () => {
        it('returns error message when dup record found by busness key', () => {
            riFindByBusnessKeyStub.resolves({id:2})
            return testObject.checkRIBusiness(1, [{}], 'entity', 'Hypothesis', ['k1','k2']).then(()=> {
                testObject.messages.length.should.equal(1)
                testObject.messages[0].should.equal("Hypothesis already exists for given business keys: k1,k2")

            })
        })

        it('returns no error message when dup record not found by busness key', () => {
            riFindByBusnessKeyStub.resolves(undefined)
            return testObject.checkRIBusiness(1, {}, 'entity',['k1','k2']).then(()=> {
                testObject.messages.length.should.equal(0)


            })
        })

    })

})

