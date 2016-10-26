const sinon = require('sinon')
const ExperimentsValidator = require('../../src/validations/ExperimentsValidator')
const AppError = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'

let baseValidatorStub
let testObject

describe('ExperimentValidator', () => {

    before(() => {
        testObject = new ExperimentsValidator()
        baseValidatorStub = sinon.stub(testObject, 'checkReferentialIntegrityById')
    })
    after(() => {
        if(baseValidatorStub){ baseValidatorStub.restore() }
    })
    const schemaArray = [
        {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 0, 'max': 100}},
        {'paramName': 'refExperimentDesignId', 'type': 'refData', 'entity': db.experimentDesign},
        {'paramName': 'status', 'type': 'constant', 'data': ['DRAFT', 'ACTIVE'], 'required': true},
        {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}
    ]

    describe('getSchema ', () => {

        it('returns schema array', () => {
            testObject.getSchema().should.eql(schemaArray)
        })


    })


    describe('performValidations ', () => {

        const targetObj = [{
            "name": "exp1002fsdfdsdfsdfsdfdsfsd",
            "subjectType": "plant",
            "userId": "akuma11",
            "refExperimentDesignId": 2,
            "status": "ACTIVE"
        }]
        it('returns resolved promise when good value passed for schema validation', () => {
            baseValidatorStub.resolves()
            return testObject.performValidations(targetObj).should.be.fulfilled

        })

        it('returns rejected promise when targetObject is not an array', () => {
            (()=>{
                testObject.performValidations({})
            }).should.throw("Experiments request object needs to be an array")

        })


    })


})

