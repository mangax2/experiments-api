/**
 * Created by kprat1 on 14/10/16.
 */
const  sinon =require('sinon')
const  HypothesisValidator  = require('../../src/validations/HypothesisValidator')
const  AppError  = require('../../src/services/utility/AppError')


describe('HypothesisValidator', () => {
    const testObject = new HypothesisValidator()
    const schemaArray = [
        {'paramName': 'description', 'type': 'text', 'lengthRange': {'min': 1, 'max': 300}, 'required': true},
        {'paramName': 'isNull', 'type': 'boolean', 'required': true},
        {'paramName': 'status', 'type': 'constant', 'data': ['INACTIVE', 'ACTIVE'], 'required': true},
        {'paramName': 'experimentId', 'type': 'refData', 'required': true},
        {'paramName': 'userId', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true}

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
        it('returns resolved promise when good value passed for schema validation', () => {
            return testObject.performValidations(targetObj).should.be.fulfilled

        })

        it('returns rejected promise when targetObject is not an array', () => {
            (()=>{
                testObject.performValidations({})
            }).should.throw("Hypothesis request object needs to be an array")

        })


    })


})

