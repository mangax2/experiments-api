const sinon = require('sinon')
const ExperimentsValidator = require('../../src/validations/ExperimentsValidator')
const AppError = require('../../src/services/utility/AppError')


describe('ExperimentValidator', () => {
    const testObject = new ExperimentsValidator()
    const schemaArray = [
        {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        {'paramName': 'subjectType', 'type': 'text', 'lengthRange': {'min': 1, 'max': 100}, 'required': true},
        {'paramName': 'reps', 'type': 'numeric', 'numericRange': {'min': 1, 'max': 1000}, 'required': true},
        {'paramName': 'refExperimentDesignId', 'type': 'refData', 'required': true},
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
            "reps": "2",
            "refExperimentDesignId": 2,
            "status": "ACTIVE"
        }]
        it('returns resolved promise when good value passed for schema validation', () => {
            return testObject.performValidations(targetObj).should.be.fulfilled

        })

        it('returns rejected promise when targetObject is not an array', () => {
            (()=>{
                testObject.performValidations({})
            }).should.throw("Experiments request object needs to be an array")

        })


    })


})

