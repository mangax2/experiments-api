const sinon = require('sinon')
const chai = require('chai')
const BaseValidator = require('../../src/validations/BaseValidator')


describe('BaseValidator', () => {

    describe('checkLength ', () => {
        const testObject = new BaseValidator()

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
        const testObject = new BaseValidator()

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
        const testObject = new BaseValidator()

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


    describe('checkNumericRange ', () => {
        const testObject = new BaseValidator()

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
        const testObject = new BaseValidator()

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


    // describe('check', () => {
    //     const testObject = new BaseValidator()
    //
    //      it('Throw exception when value is not a valid constant', () => {
    //         testObject.checkConstants('ACTIVE1', ['ACTIVE'], 'param1')
    //         testObject.messages.length.should.equal(1)
    //         testObject.messages[0].should.equal("param1 requires a valid value")
    //          const errorMessage={
    //              "validationMessages": [
    //                  "param1 requires a valid value"
    //              ]
    //          }
    //          chai.assert.throws(testObject.check(), Error, errorMessage)
    //
    //
    //     })
    //
    // })


})

