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
        let validateBatchForRIStub
        let hasErrorsStub

        before(() => {
            validateEntityStub = sinon.stub(target, 'validateEntity')
            validateBatchForRIStub = sinon.stub(target, 'validateBatchForRI')
            hasErrorsStub = sinon.stub(target, 'hasErrors')
        })

        afterEach(() => {
            validateEntityStub.reset()
            validateBatchForRIStub.reset()
            hasErrorsStub.reset()
        })

        after(() => {
            validateEntityStub.restore()
            validateBatchForRIStub.restore()
            hasErrorsStub.restore()
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
                sinon.assert.notCalled(hasErrorsStub)
                sinon.assert.notCalled(validateBatchForRIStub)
            })
        })

        it('returns rejected promise when one validation of many returns rejected promise', () => {
            const element1 = {}
            const element2 = {}
            validateEntityStub.onFirstCall().resolves()
            validateEntityStub.onSecondCall().rejects(testError)

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
                sinon.assert.notCalled(hasErrorsStub)
                sinon.assert.notCalled(validateBatchForRIStub)
            })
        })

        it('returns resolved when validateEntity passes but validateBatchForRI is not called when there are errors', () => {
            const element1 = {}
            validateEntityStub.resolves()
            hasErrorsStub.returns(true)

            return target._validateArray([element1], 'opName', testTransaction).then(() => {
                validateEntityStub.callCount.should.eql(1)
                sinon.assert.calledWithExactly(
                    validateEntityStub,
                    sinon.match.same(element1),
                    'opName',
                    sinon.match.same(testTransaction)
                )
                sinon.assert.calledOnce(hasErrorsStub)
                sinon.assert.notCalled(validateBatchForRIStub)
            })
        })

        it('returns resolved promise when all pass and validateBatchForRI is called when there are no errors', () => {
            const element1 = {}
            const element2 = {}
            const objectArray = [element1, element2]
            validateEntityStub.onFirstCall().resolves()
            validateEntityStub.onSecondCall().resolves()
            hasErrorsStub.returns(false)
            validateBatchForRIStub.onFirstCall().resolves()

            return target._validateArray(objectArray, 'opName', testTransaction).then(() => {
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
                sinon.assert.calledOnce(hasErrorsStub)
                sinon.assert.calledWithExactly(
                    validateBatchForRIStub,
                    sinon.match.same(objectArray),
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

    describe('validateBatchForRI', () => {
        it('returns rejected promise', () => {
            return target.validateBatchForRI({}, 'opName', testTransaction).should.be.rejected
        })
    })

    describe('checkLength ', () => {
        it('updates error messages when input is not a string literal', () =>{
            target.checkLength(0, {'min': 1, 'max': 100}, 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 must be a string")
        })
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

    describe('literalCheck ', () => {
        it('returns false and updates error messages when input is an array', () =>{
            const result = target.literalCheck([1,2,3], 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 must be a literal value. Object and Arrays are not supported.")
            result.should.equal(false)
        })

        it('returns false and updates messages with error when input is an Object', () => {
            const result = target.literalCheck({'a':'b'}, 'param1')
            target.messages.length.should.equal(1)
            target.messages[0].should.equal("param1 must be a literal value. Object and Arrays are not supported.")
            result.should.equal(false)

        })

        it('returns true when value is a literal', () => {
            const result = target.literalCheck('aa', 'param1')
            target.messages.length.should.equal(0)
            result.should.equal(true)
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

    describe('checkBoolean', () => {
        it('pushes message when not boolean', () => {
            target.checkBoolean(42, 'testVar')
            target.hasErrors().should.equal(true)
            target.messages.length.should.equal(1)
            target.messages[0].should.equal('testVar must be boolean')
        })

        it('does not push message when value is true', () => {
            target.checkBoolean(true, 'testVar')
            target.hasErrors().should.equal(false)
        })

        it('does not push message when value is false', () => {
            target.checkBoolean(false, 'testVar')
            target.hasErrors().should.equal(false)
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

    describe('checkRIBatch', () => {
        let getPromiseForRIorBusinessKeyCheckStub

        before(() => {
            getPromiseForRIorBusinessKeyCheckStub = sinon.stub(target, '_getPromiseForRIorBusinessKeyCheck')
        })

        afterEach(() => {
            getPromiseForRIorBusinessKeyCheckStub.reset()
        })

        after(() => {
            getPromiseForRIorBusinessKeyCheckStub.restore()
        })

        it('resolves to  empty array when passed emtpy array', () => {
            return target.checkRIBatch([], testTransaction).then((data) => {
                data.length.should.equal(0)
                sinon.assert.notCalled(getPromiseForRIorBusinessKeyCheckStub)
            })
        })

        it('resolve single result for single input', () => {
            const groupSet1 = {}
            const expectedResult1 = {}
            getPromiseForRIorBusinessKeyCheckStub.resolves(expectedResult1)

            return target.checkRIBatch([groupSet1], testTransaction).then((data) => {
                data.length.should.equal(1)
                data[0].should.equal(expectedResult1)
                sinon.assert.calledOnce(getPromiseForRIorBusinessKeyCheckStub)
                sinon.assert.calledWithExactly(
                    getPromiseForRIorBusinessKeyCheckStub,
                    sinon.match.same(groupSet1),
                    sinon.match.same(testTransaction)
                )
            })
        })

        it('resolve multiple results for multiple inputs', () => {
            const groupSet1 = {}
            const groupSet2 = {}
            const expectedResult1 = {}
            const expectedResult2 = {}
            getPromiseForRIorBusinessKeyCheckStub.onFirstCall().resolves(expectedResult1)
            getPromiseForRIorBusinessKeyCheckStub.onSecondCall().resolves(expectedResult2)

            return target.checkRIBatch([groupSet1, groupSet2], testTransaction).then((data) => {
                data.length.should.equal(2)
                data[0].should.equal(expectedResult1)
                data[1].should.equal(expectedResult2)
                sinon.assert.calledTwice(getPromiseForRIorBusinessKeyCheckStub)
                sinon.assert.calledWithExactly(
                    getPromiseForRIorBusinessKeyCheckStub,
                    sinon.match.same(groupSet1),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.calledWithExactly(
                    getPromiseForRIorBusinessKeyCheckStub,
                    sinon.match.same(groupSet2),
                    sinon.match.same(testTransaction)
                )
            })
        })

        it('rejects when any ri or business key promise is rejected', () => {
            const groupSet1 = {}
            const groupSet2 = {}
            const expectedResult1 = {}
            getPromiseForRIorBusinessKeyCheckStub.onFirstCall().resolves(expectedResult1)
            getPromiseForRIorBusinessKeyCheckStub.onSecondCall().rejects(testError)

            return target.checkRIBatch([groupSet1, groupSet2], testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledTwice(getPromiseForRIorBusinessKeyCheckStub)
                sinon.assert.calledWithExactly(
                    getPromiseForRIorBusinessKeyCheckStub,
                    sinon.match.same(groupSet1),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.calledWithExactly(
                    getPromiseForRIorBusinessKeyCheckStub,
                    sinon.match.same(groupSet2),
                    sinon.match.same(testTransaction)
                )
            })
        })
    })

    describe('_getPromiseForRIorBusinessKeyCheck', () => {
        let getDistinctIdsStub
        let verifyIdsExistStub
        let verifyBusinessKeysAreUniqueStub
        let testEntity
        let testGroupSet = [{entity: testEntity}]

        before(() => {
            getDistinctIdsStub = sinon.stub(target, '_getDistinctIds')
            verifyIdsExistStub = sinon.stub(target, '_verifyIdsExist')
            verifyBusinessKeysAreUniqueStub = sinon.stub(target, '_verifyBusinessKeysAreUnique')
        })

        afterEach(() => {
            getDistinctIdsStub.reset()
            verifyIdsExistStub.reset()
            verifyBusinessKeysAreUniqueStub.reset()
        })

        after(() => {
            getDistinctIdsStub.restore()
            verifyIdsExistStub.restore()
            verifyBusinessKeysAreUniqueStub.restore()
        })

        it('resolves immediately when groupSet is empty array', () => {
            return target._getPromiseForRIorBusinessKeyCheck([], testTransaction).then(() => {
                sinon.assert.notCalled(getDistinctIdsStub)
                sinon.assert.notCalled(verifyIdsExistStub)
                sinon.assert.notCalled(verifyBusinessKeysAreUniqueStub)
            })
        })

        it('verifies ids exist when ids are found in the the group set', () => {
            getDistinctIdsStub.returns([1])
            verifyIdsExistStub.resolves()

            return target._getPromiseForRIorBusinessKeyCheck(testGroupSet, testTransaction).then(() => {
                sinon.assert.calledOnce(getDistinctIdsStub)
                sinon.assert.calledWithExactly(
                    getDistinctIdsStub,
                    sinon.match.same(testGroupSet)
                )
                sinon.assert.calledOnce(verifyIdsExistStub)
                sinon.assert.calledWithExactly(
                    verifyIdsExistStub,
                    [1],
                    sinon.match.same(testGroupSet),
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.notCalled(verifyBusinessKeysAreUniqueStub)
            })
        })

        it('verifies business keys are unique when ids are not found in the the group set', () => {
            getDistinctIdsStub.returns([])
            verifyBusinessKeysAreUniqueStub.resolves()

            return target._getPromiseForRIorBusinessKeyCheck(testGroupSet, testTransaction).then(() => {
                sinon.assert.calledOnce(getDistinctIdsStub)
                sinon.assert.calledWithExactly(
                    getDistinctIdsStub,
                    sinon.match.same(testGroupSet)
                )
                sinon.assert.calledOnce(verifyBusinessKeysAreUniqueStub)
                sinon.assert.calledWithExactly(
                    verifyBusinessKeysAreUniqueStub,
                    sinon.match.same(testGroupSet),
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.notCalled(verifyIdsExistStub)
            })
        })

        it('rejects when verifying ids is rejected', () => {
            getDistinctIdsStub.returns([1])
            verifyIdsExistStub.rejects(testError)

            return target._getPromiseForRIorBusinessKeyCheck(testGroupSet, testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledOnce(getDistinctIdsStub)
                sinon.assert.calledWithExactly(
                    getDistinctIdsStub,
                    sinon.match.same(testGroupSet)
                )
                sinon.assert.calledOnce(verifyIdsExistStub)
                sinon.assert.calledWithExactly(
                    verifyIdsExistStub,
                    [1],
                    sinon.match.same(testGroupSet),
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.notCalled(verifyBusinessKeysAreUniqueStub)
            })
        })

        it('rejects when business keys unique check is rejected', () => {
            getDistinctIdsStub.returns([])
            verifyBusinessKeysAreUniqueStub.rejects(testError)

            return target._getPromiseForRIorBusinessKeyCheck(testGroupSet, testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledOnce(getDistinctIdsStub)
                sinon.assert.calledWithExactly(
                    getDistinctIdsStub,
                    sinon.match.same(testGroupSet)
                )
                sinon.assert.calledOnce(verifyBusinessKeysAreUniqueStub)
                sinon.assert.calledWithExactly(
                    verifyBusinessKeysAreUniqueStub,
                    sinon.match.same(testGroupSet),
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.notCalled(verifyIdsExistStub)
            })
        })
    })

    describe('_getDistinctIds', () => {
        it('filters out undefined and null values', () => {
            const r = target._getDistinctIds([{}, {id: 1}, {id: null}])
            r.length.should.equal(1)
            r[0].should.equal(1)
        })

        it('filters out duplicates', () => {
            const r = target._getDistinctIds([{id: 1}, {id: 2}, {id: 1}, {id: 3}, {id: 2}, {id: 1}])
            r.should.eql([1,2,3])
        })
    })

    describe('verifyIdsExist', () => {
        let getEntitiesByIdsStub
        let getEntityNameStub
        let getIdDifferenceStub

        let testEntity = {}
        let testGroupSet = {}

        before(() => {
            getEntitiesByIdsStub = sinon.stub(target.referentialIntegrityService, 'getEntitiesByIds')
            getEntityNameStub = sinon.stub(target, 'getEntityName')
            getIdDifferenceStub = sinon.stub(target, '_getIdDifference')
        })

        afterEach(() => {
            getEntitiesByIdsStub.reset()
            getEntityNameStub.reset()
            getIdDifferenceStub.reset()
        })

        after(() => {
            getEntitiesByIdsStub.restore()
            getEntityNameStub.restore()
            getIdDifferenceStub.restore()
        })

        it('rejects when getEntitiesByIds is rejected', () => {
            getEntitiesByIdsStub.rejects(testError)

            return target._verifyIdsExist([1], testGroupSet, testEntity, testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledOnce(getEntitiesByIdsStub)
                sinon.assert.calledWithExactly(
                    getEntitiesByIdsStub,
                    [1],
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
            })
        })

        it('adds message with entity name and results of id difference when count of found ids in not equal to count of requested ids', () => {
            getEntitiesByIdsStub.resolves([2,3])
            getEntityNameStub.returns('TestEntity')
            getIdDifferenceStub.returns([1])

            return target._verifyIdsExist([1,2,3], [{paramName: 'testId'}], testEntity, testTransaction).then(() => {
                target.messages.should.eql(['TestEntity not found for testId(s): 1'])
                sinon.assert.calledOnce(getEntitiesByIdsStub)
                sinon.assert.calledWithExactly(
                    getEntitiesByIdsStub,
                    [1,2,3],
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.calledOnce(getEntityNameStub)
                sinon.assert.calledOnce(getIdDifferenceStub)
                sinon.assert.calledWithExactly(
                    getIdDifferenceStub,
                    [1,2,3],
                    [2,3]
                )
            })
        })

        it('does not add message when count of found ids equals count of requested ids', () => {
            getEntitiesByIdsStub.resolves([1,2,3])

            return target._verifyIdsExist([1,2,3], testGroupSet, testEntity, testTransaction).then(() => {
                target.messages.should.eql([])
                sinon.assert.calledOnce(getEntitiesByIdsStub)
                sinon.assert.calledWithExactly(
                    getEntitiesByIdsStub,
                    [1,2,3],
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.notCalled(getEntityNameStub)
                sinon.assert.notCalled(getIdDifferenceStub)
            })
        })
    })

    describe('_extractBusinessKeys', () => {
        it('creates new objects with only the necessary information', () => {
            target._extractBusinessKeys([
                {
                    keys: [1, 'name1'],
                    updateId: 9,
                    extraData: {}
                },
                {
                    keys: [2, 'name2'],
                    updateId: 8,
                    extraData: {}
                },
                {
                    keys: [3, 'name3'],
                    updateId: 7,
                    extraData: {}
                }
            ]).should.eql([
                {
                    keys: [1, 'name1'],
                    updateId: 9
                },
                {
                    keys: [2, 'name2'],
                    updateId: 8
                },
                {
                    keys: [3, 'name3'],
                    updateId: 7
                }
            ])
        })
    })

    describe('_verifyBusinessKeysAreUnique', () => {
        let extractBusinessKeysStub
        let getEntitiesByKeysStub
        let getEntityNameStub
        let formatBusinessKeyStub

        let testGroupSet = {}
        let expectedBusinessKeys = {}
        let testEntity = {}

        before(() => {
            extractBusinessKeysStub = sinon.stub(target, '_extractBusinessKeys')
            getEntitiesByKeysStub = sinon.stub(target.referentialIntegrityService, 'getEntitiesByKeys')
            getEntityNameStub = sinon.stub(target, 'getEntityName')
            formatBusinessKeyStub = sinon.stub(target, '_formatBusinessKey')
        })

        afterEach(() => {
            extractBusinessKeysStub.reset()
            getEntitiesByKeysStub.reset()
            getEntityNameStub.reset()
            formatBusinessKeyStub.reset()
        })

        after(() => {
            extractBusinessKeysStub.restore()
            getEntitiesByKeysStub.restore()
            getEntityNameStub.restore()
            formatBusinessKeyStub.restore()
        })

        it('rejects when getEntitiesByKeys rejects', () => {
            extractBusinessKeysStub.returns(expectedBusinessKeys)
            getEntitiesByKeysStub.rejects(testError)

            return target._verifyBusinessKeysAreUnique(testGroupSet, testEntity, testTransaction).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledOnce(extractBusinessKeysStub)
                sinon.assert.calledWithExactly(
                    extractBusinessKeysStub,
                    sinon.match.same(testGroupSet)
                )
                sinon.assert.calledOnce(getEntitiesByKeysStub)
                sinon.assert.calledWithExactly(
                    getEntitiesByKeysStub,
                    sinon.match.same(expectedBusinessKeys),
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.notCalled(getEntityNameStub)
                sinon.assert.notCalled(formatBusinessKeyStub)
            })
        })

        it('adds message to messages when matching business key exists in database', () => {
            const expectedData = [1]

            extractBusinessKeysStub.returns(expectedBusinessKeys)
            getEntitiesByKeysStub.resolves(expectedData)
            getEntityNameStub.returns("Entity name")
            formatBusinessKeyStub.returns(" formatted key")

            return target._verifyBusinessKeysAreUnique(testGroupSet, testEntity, testTransaction).then(() => {
                target.messages.should.eql(['Entity name already exists for business keys formatted key'])

                sinon.assert.calledOnce(extractBusinessKeysStub)
                sinon.assert.calledWithExactly(
                    extractBusinessKeysStub,
                    sinon.match.same(testGroupSet)
                )
                sinon.assert.calledOnce(getEntitiesByKeysStub)
                sinon.assert.calledWithExactly(
                    getEntitiesByKeysStub,
                    sinon.match.same(expectedBusinessKeys),
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.calledOnce(getEntityNameStub)
                sinon.assert.calledOnce(formatBusinessKeyStub)
                sinon.assert.calledWithExactly(
                    formatBusinessKeyStub,
                    sinon.match.same(expectedData)
                )
            })
        })

        it('does not add message to messages when no matching business key exists in database', () => {
            const expectedData = []

            extractBusinessKeysStub.returns(expectedBusinessKeys)
            getEntitiesByKeysStub.resolves(expectedData)

            return target._verifyBusinessKeysAreUnique(testGroupSet, testEntity, testTransaction).then(() => {
                target.messages.should.eql([])

                sinon.assert.calledOnce(extractBusinessKeysStub)
                sinon.assert.calledWithExactly(
                    extractBusinessKeysStub,
                    sinon.match.same(testGroupSet)
                )
                sinon.assert.calledOnce(getEntitiesByKeysStub)
                sinon.assert.calledWithExactly(
                    getEntitiesByKeysStub,
                    sinon.match.same(expectedBusinessKeys),
                    sinon.match.same(testEntity),
                    sinon.match.same(testTransaction)
                )
                sinon.assert.notCalled(getEntityNameStub)
                sinon.assert.notCalled(formatBusinessKeyStub)
            })
        })
    })

    describe('_getIdDifference', () => {
        it('returns empty array when inputs are the same', () => {
            target._getIdDifference([1,2,3], [{id:1},{id:2},{id:3}]).should.eql([])
        })

        it('returns difference when arrays are not the same', () => {
            target._getIdDifference([1,2,3], [{id:1},{id:2}]).should.eql([3])
        })
    })

    describe('_formatBusinessKey', () => {
        it('converts single object to string and removes double quotes', () => {
            target._formatBusinessKey([{key:'k1', value:'v1'}]).should.equal('{key:k1,value:v1}')
        })

        it('converts multiple objects to string and removes double quotes', () => {
            target._formatBusinessKey([{key:'k1', value:'v1'},{key:'k2', value:'v2'}])
                .should.equal('{key:k1,value:v1},{key:k2,value:v2}')
        })
    })

    describe('getEntityName', () => {
        it('throws exception', () => {
            (() => {
                target.getEntityName()
            }).should.throw('entityName not implemented')
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

    describe('_getIdDifference', () => {
        it('returns empty when both arguments have same ids', () => {
           const diff= target._getIdDifference([2,4,5],[{id:2},{id:4},{id:5}])
            diff.length.should.equal(0)
        })
        it('returns diff array when first argument has more ids', () => {
            const diff= target._getIdDifference([2,4,5, 6, 7],[{id:2},{id:4},{id:5}])
            diff.should.eql([6,7])

        })
        it('returns diff array when second argument is empty array', () => {
            const diff= target._getIdDifference([2,4,5, 6, 7],[])
            diff.should.eql([2,4,5, 6, 7])

        })
    })


    describe('_formatBusinessKey', () => {
        it('returns empty stringify object without double quotes in string when input is empty object', () => {
            const businessKeyObj= target._formatBusinessKey([{}])
            businessKeyObj.should.eql('{}' )
        })

        it('returns empty stringify object without double quotes in string from input object', () => {
            const businessKeyObj= target._formatBusinessKey([{"a":"1"}])
            businessKeyObj.should.eql('{a:1}' )
        })

        it('returns empty stringify objects without double quotes in string from list of objects', () => {
            const businessKeyObj= target._formatBusinessKey([{"a":"1"},{"b":"2"}])
            businessKeyObj.should.eql('{a:1},{b:2}')
        })

        it('returns diff array when first argument has more ids', () => {
            const diff= target._getIdDifference([2,4,5, 6, 7],[{id:2},{id:4},{id:5}])
            diff.should.eql([6,7])

        })
        it('returns diff array when second argument is empty array', () => {
            const diff= target._getIdDifference([2,4,5, 6, 7],[])
            diff.should.eql([2,4,5, 6, 7])

        })
    })

})

