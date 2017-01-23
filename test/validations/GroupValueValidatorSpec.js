const  sinon =require('sinon')
const  GroupValueValidator = require('../../src/validations/GroupValueValidator')
const ReferentialIntegrityService = require('../../src/services/ReferentialIntegrityService')

const  AppError  = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'

describe('GroupValueValidator', () => {
    const target = new GroupValueValidator()
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
        {'paramName': 'factorName', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': false},
        {'paramName': 'factorLevel', 'type': 'text', 'lengthRange': {'min': 0, 'max': 500}, 'required': false},
        {'paramName': 'groupId', 'type': 'numeric', 'required': true},
        {'paramName': 'groupId', 'type': 'refData', 'entity': db.group},
        {
            'paramName': 'GroupValue',
            'type': 'businessKey',
            'keys': ['groupId', 'factorName'],
            'entity': db.groupValue
        },
        {'paramName': 'repNumber', 'type': 'numeric', required: false}
    ]

    const schemaArrayForPutOperation=schemaArrayForPostOperation.concat([{'paramName': 'id', 'type': 'numeric', 'required': true},
        {'paramName': 'id', 'type': 'refData', 'entity': db.groupValue}])

    describe('getSchema', () => {
        it('returns schema array for POST operation', () => {
            target.getSchema('POST').should.eql(schemaArrayForPostOperation)
        })
        it('returns schema array for PUT operation', () => {
            target.getSchema('PUT').should.eql(schemaArrayForPutOperation)
        })
    })

    describe('entityName', () => {
        it('returns name of the entity', () => {
            target.getEntityName().should.equal('GroupValue')
        })
    })

    describe('getBusinessKeyPropertyNames', () => {
        it('returns array of property names for the business key', () => {
            target.getBusinessKeyPropertyNames().should.eql(['factorName', 'groupId'])
        })
    })

    describe('getDuplicateBusinessKeyError', () => {
        it('returns duplicate error message string', () => {
            target.getDuplicateBusinessKeyError().should.eql(
                'Duplicate factor name and level in request payload with same groupId')
        })
    })

    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Group Value request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Group Value request object needs to be an array')
            })
        })

        it('returns rejected promise when factor name, level, and rep number are all filled out', ()=>{
            return target.preValidate([{factorName: 'test', factorLevel: 'test', repNumber: 1}]).should.be.rejected
        })

        it('returns rejected promise when factor name and rep number are all filled out', ()=>{
            return target.preValidate([{factorName: 'test', repNumber: 1}]).should.be.rejected
        })

        it('returns rejected promise when factor level and rep number are all filled out', ()=>{
            return target.preValidate([{factorLevel: 'test', repNumber: 1}]).should.be.rejected
        })

        it('returns rejected promise when factor name is present without a factor level', ()=>{
            return target.preValidate([{factorName: 'test'}]).should.be.rejected
        })

        it('returns rejected promise when factor level is present without a factor name', ()=>{
            return target.preValidate([{factorLevel: 'test'}]).should.be.rejected
        })

        it('returns a rejected promise when everything is missing', ()=>{
            return target.preValidate([{}]).should.be.rejected
        })

        it('returns a resolved promise when just factor name and level are filled out', ()=>{
            return target.preValidate([{factorName: 'test', factorLevel: 'test'}]).then(()=>{
                sinon.assert.notCalled(badRequestStub)
            })
        })

        it('returns a resolved promise when just rep number is filled out', ()=>{
            return target.preValidate([{repNumber: 1}]).then(()=>{
                sinon.assert.notCalled(badRequestStub)
            })
        })
    })

    describe('postValidate', () => {
        /*
         postValidate(targetObject) {
         if (!this.hasErrors()) {
         const businessKeyPropertyNames = this.getBusinessKeyPropertyNames()
         const businessKeyArray = _.map(targetObject, (obj)=> {
         return _.pick(obj, businessKeyPropertyNames)
         })
         const groupByObject = _.values(_.groupBy(businessKeyArray, keyObj=>keyObj.groupId))
         _.forEach(groupByObject, innerArray=> {
         const names = _.map(innerArray, e=> {
         return e[businessKeyPropertyNames[1]]

         })
         if (_.uniq(names).length != names.length) {
         this.messages.push(this.getDuplicateBusinessKeyError())
         return false
         }
         })
         }
         return Promise.resolve()
         */


        let hasErrorsStub
        let getBusinessKeyPropertyNamesStub
        let getDuplicateBusinessKeyErrorStub

        before(() => {
            hasErrorsStub = sinon.stub(target, 'hasErrors')
            getBusinessKeyPropertyNamesStub = sinon.stub(target, 'getBusinessKeyPropertyNames')
            getDuplicateBusinessKeyErrorStub = sinon.stub(target, 'getDuplicateBusinessKeyError')
            getBusinessKeyPropertyNamesStub.returns(['groupId','factorName'])

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
                        factorName: 'A',
                        groupId:1

                    },
                    {
                        factorName: 'B',
                        groupId:1
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
                        factorName: 'A',
                        groupId:2
                    },
                    {
                        factorName: 'A',
                        groupId:2
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
