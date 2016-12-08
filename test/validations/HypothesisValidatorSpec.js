/**
 * Created by kprat1 on 14/10/16.
 */
const  sinon =require('sinon')
const  HypothesisValidator  = require('../../src/validations/HypothesisValidator')
const ReferentialIntegrityService = require('../../src/services/ReferentialIntegrityService')

const  AppError  = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'

describe('HypothesisValidator', () => {
    const target = new HypothesisValidator()
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

    const schemaArray = [
        {'paramName': 'description', 'type': 'text', 'lengthRange': {'min': 0, 'max': 1000}, 'required': false},
        {'paramName': 'isNull', 'type': 'boolean', 'required': true},
        {'paramName': 'status', 'type': 'constant', 'data': ['INACTIVE', 'ACTIVE'], 'required': true},
        {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
        {'paramName': 'experimentId', 'type': 'refData', 'required': true, 'entity': db.experiments},
        {'paramName': 'Hypothesis', 'type': 'businessKey', 'keys': ['experimentId', 'description', 'isNull'], 'entity': db.hypothesis}
    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            target.getSchema().should.eql(schemaArray)
        })
    })

    describe('entityName', () => {
        it('returns name of the entity', () => {
            target.getEntityName().should.equal('Hypothesis')
        })
    })

    describe('getBusinessKeyPropertyNames', () => {
        it('returns array of property names for the business key', () => {
            target.getBusinessKeyPropertyNames().should.eql(['experimentId','description','isNull'])
        })
    })

    describe('getDuplicateBusinessKeyError', () => {
        it('returns duplicate error message string', () => {
            target.getDuplicateBusinessKeyError().should.eql(
                'duplicate hypotheses in request payload with same experiment id')
        })
    })

    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Hypothesis request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Hypothesis request object needs to be an array')
            })
        })

        it('returns resolved promise when input is array.' , () => {
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
            getBusinessKeyPropertyNamesStub.returns(['experimentId','description'],'isNull')

            const r = target.postValidate(
                [
                    {
                        experimentId:2,
                        description:'aa',
                        isNull:false

                    },
                    {
                        experimentId:2,
                        description:'bb',
                        isNull:false
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
            getBusinessKeyPropertyNamesStub.returns(['experimentId','description'],'isNull')
            getDuplicateBusinessKeyErrorStub.returns('Error message')

            const r = target.postValidate(
                [
                    {
                        experimentId:2,
                        description:'bb',
                        isNull:false
                    },
                    {
                        experimentId:2,
                        description:'bb',
                        isNull:false
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

