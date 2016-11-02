const sinon = require('sinon')
const chai = require('chai')
import db from '../../src/db/DbManager'
const ExperimentDesignsValidator = require('../../src/validations/ExperimentDesignsValidator')
const SchemaValidator = require('../../src/validations/SchemaValidator')
let findStub

describe('ExperimentDesignsValidator', () => {
    let experimentDesignsValidator = new ExperimentDesignsValidator()


    before(() => {
        findStub = sinon.stub(experimentDesignsValidator.referentialIntegrityService, 'getByBusinessKey')

    })
    after(() => {
        findStub.restore()
    })
    afterEach(() => {
        findStub.reset()
    })

    const schemaArray = [
        {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 50}, 'required': true},
        {'paramName': 'ExperimentDesign', 'type': 'businessKey', 'keys': ['name'], 'entity': db.experimentDesign}

    ]

    describe('getSchema ', () => {
        it('returns schema array', () => {
            return experimentDesignsValidator.getSchema().should.eql(schemaArray)
        })
    })

    describe('performValidations ', () => {

        it('returns resolved promise when good value passed for schema validation', () => {
            findStub.resolves({'id': 1})
            const targetObj = [{
                "name": "testDesign",
            }]
            return experimentDesignsValidator.performValidations(targetObj).should.be.fulfilled
        })

        it('returns rejected promise when targetObject is not an array', () => {
            (()=> {
                experimentDesignsValidator.performValidations({})
            }).should.throw("Experiment Designs request object needs to be an array")

        })
    })
})

