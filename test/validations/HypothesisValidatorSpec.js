/**
 * Created by kprat1 on 14/10/16.
 */
const  sinon =require('sinon')
const  HypothesisValidator  = require('../../src/validations/HypothesisValidator')
const ReferentialIntegrityService = require('../../src/services/ReferentialIntegrityService')

const  AppError  = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'

let baseValidatorStub
let getByBusinessKeyStub
describe('HypothesisValidator', () => {
    const testObject = new HypothesisValidator()

    before(() => {
        baseValidatorStub = sinon.stub(testObject, 'checkReferentialIntegrityById')
        getByBusinessKeyStub= sinon.stub(testObject.referentialIntegrityService, 'getByBusinessKey')
    })
    after(() => {
        baseValidatorStub.restore()
        getByBusinessKeyStub.restore()
    })
    const schemaArray = [
        {'paramName': 'description', 'type': 'text', 'lengthRange': {'min': 1, 'max': 300}, 'required': true},
        {'paramName': 'isNull', 'type': 'boolean', 'required': true},
        {'paramName': 'status', 'type': 'constant', 'data': ['INACTIVE', 'ACTIVE'], 'required': true},
        {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
        {'paramName': 'experimentId', 'type': 'refData', 'required': true, 'entity': db.experiments},
        {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        {'paramName': 'Hypothesis', 'type': 'businessKey', 'keys': ['experimentId', 'description', 'isNull'], 'entity': db.hypothesis}


    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            testObject.getSchema().should.eql(schemaArray)
        })
    })

    describe('performValidations ', () => {
        const targetObj = [{
            "description": "Independent variables have affect on Depenedent Variables",
            "isNull": true,
            "status": "ACTIVE",
            "experimentId": 17,
            "userId": "kprat1"

        }]
        const targetOb=[{

            "description": "abc",
            "isNull": false,
            "status": "ACTIVE",
            "experimentId":3,
            "userId": "kprat1"

        },
            {

                "description": "abc",
                "isNull": false,
                "status": "ACTIVE",
                "experimentId": 3,
                "userId": "kprat1"

            }
        ]
        it('returns resolved promise when good value passed for schema validation', () => {
            baseValidatorStub.resolves()
            getByBusinessKeyStub.resolves(undefined)
            return testObject.performValidations(targetObj).should.be.fulfilled

        })

        it('returns rejected promise when targetObject is not an array', () => {
            (()=>{
                testObject.performValidations({})
            }).should.throw("Hypothesis request object needs to be an array")

        })


        it('returns rejected promise when targetObject has same hypothesis', () => {
            (function () {
                testObject.checkBusinessKey(targetOb)
            }).should.throw('duplicate hypotheses in request payload with same experiment id')

        })
    })


})

