/**
 * Created by kprat1 on 14/10/16.
 */
const  sinon =require('sinon')
const  DependentVariablesValidator  = require('../../src/validations/DependentVariablesValidator')
const ReferentialIntegrityService = require('../../src/services/ReferentialIntegrityService')

const  AppError  = require('../../src/services/utility/AppError')
import db from '../../src/db/DbManager'

describe('DependentVariablesValidator', () => {
    const target = new DependentVariablesValidator()
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
        {'paramName': 'required', 'type': 'boolean', 'required': true},
        {'paramName': 'name', 'type': 'text', 'lengthRange': {'min': 1, 'max': 500}, 'required': true},
        {'paramName': 'experimentId', 'type': 'numeric', 'required': true},
        {'paramName': 'experimentId', 'type': 'refData', 'entity': db.experiments},
        {
            'paramName': 'DependentVariable',
            'type': 'businessKey',
            'keys': ['experimentId', 'name'],
            'entity': db.dependentVariable
        }
    ]

    const schemaArrayForPutOperation=schemaArrayForPostOperation.concat([{'paramName': 'id', 'type': 'numeric', 'required': true},
        {'paramName': 'id', 'type': 'refData', 'entity': db.dependentVariable}])

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
            target.entityName.should.equal('DependentVariable')
        })
    })

    describe('getBusinessKeyPropertyNames', () => {
        it('returns array of property names for the business key', () => {
            target.getBusinessKeyPropertyNames().should.eql(['experimentId', 'name'])
        })
    })

    describe('getDuplicateBusinessKeyError', () => {
        it('returns duplicate error message string', () => {
            target.getDuplicateBusinessKeyError().should.eql(
                'duplicate dependent variable name in request payload with same experiment id')
        })
    })

    describe('preValidate', () => {
        it('returns rejected promise when input is not an array.' , () => {
            return target.preValidate({}).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Dependent Variables request object needs to be an array')
            })
        })

        it('returns rejected promise when input is empty array.' , () => {
            return target.preValidate([]).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    badRequestStub,
                    'Dependent Variables request object needs to be an array')
            })
        })

        it('returns resolved promise when input is array.' , () => {
            return target.preValidate([{}]).then(() => {
                sinon.assert.notCalled(badRequestStub)
            })
        })
    })
})

