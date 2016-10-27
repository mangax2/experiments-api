/**
 * Created by kprat1 on 14/10/16.
 */
const  sinon =require('sinon')
const  DependentVariablesValidator  = require('../../src/validations/DependentVariablesValidator')
const ReferentialIntegrityService = require('../../src/services/ReferentialIntegrityService')

const  AppError  = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'

let baseValidatorStub
let getByBusinessKeyStub
describe('DependentVariablesValidator', () => {
    const testObject = new DependentVariablesValidator()

    before(() => {
        baseValidatorStub = sinon.stub(testObject, 'checkReferentialIntegrityById')
        getByBusinessKeyStub= sinon.stub(testObject.referentialIntegrityService, 'getByBusinessKey')
    })
    after(() => {
        baseValidatorStub.restore()
        getByBusinessKeyStub.restore()
    })
    const schemaArrayForPostOperation = [
        {'paramName': 'required', 'type': 'boolean', 'required': true},
        {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
        {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
        {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments, 'required': true},
        {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        {
            'paramName': 'DependentVariable',
            'type': 'businessKey',
            'keys': ['experimentId', 'name'],
            'entity': db.dependentVariable
        }
    ]

    const schemaArrayForPutOperation=schemaArrayForPostOperation.concat([{'paramName': 'id', 'type': 'numeric', 'required': true},
        {'paramName': 'id', 'type': 'refData', 'entity': db.dependentVariable, 'operation': 'PUT'}])

    describe('getSchema', () => {
        it('returns schema array for POST operation', () => {
            testObject.getSchema('POST').should.eql(schemaArrayForPostOperation)
        })
        it('returns schema array for PUT operation', () => {
            testObject.getSchema('PUT').should.eql(schemaArrayForPutOperation)
        })
    })

    describe('performValidations ', () => {
        const targetObj = [{
            "id":1,
            "required": true,
            "name": "yield",
            "experimentId": 17,
            "userId": "akuma11"

        }]
        const dupObjects=targetObj.concat({
                "id":1,
                "required": true,
                "name": "yield",
                "experimentId": 17,
                "userId": "akuma11"

            }
        )
        it('returns resolved promise when good value passed for schema validation for PUT operation', () => {
            baseValidatorStub.resolves()
            getByBusinessKeyStub.resolves()
            return testObject.performValidations(targetObj,'PUT').should.be.fulfilled

        })

        it('returns resolved promise when good value passed for schema validation for POST operation', () => {
            baseValidatorStub.resolves()
            getByBusinessKeyStub.resolves()
            return testObject.performValidations(targetObj,'POST').should.be.fulfilled

        })


        it('returns rejected promise when targetObject is not an array', () => {
            (()=>{
                testObject.performValidations({})
            }).should.throw("Dependent Variables request object needs to be an array")

        })


        it('returns rejected promise when targetObject has same busineskey', () => {
            (function () {
                testObject.checkBusinessKey(dupObjects)
            }).should.throw('duplicate dependent variable name in request payload with same experiment id')

        })


    })


})

