const sinon = require('sinon')
const chai = require('chai')
const UnitSpecificationService = require('../../src/services/UnitSpecificationService')
const db = require('../../src/db/DbManager')

describe('UnitSpecificationService', () => {

    let findStub
    let allStub

    before(() => {
        findStub = sinon.stub(db.unitSpecification, 'find')
        allStub = sinon.stub(db.unitSpecification, 'all')
    })

    after(() => {
        findStub.restore()
        allStub.restore()
    })

    afterEach(() => {
        findStub.reset()
        allStub.reset()
    })

    describe('Get Unit Specification By ID', () => {
        it('succeeds and returns unit specification when found', () => {
            const testResponse = {
                'response':   {id: 1, name: "Length"}
            }
            findStub.resolves(testResponse)

            return new UnitSpecificationService().getUnitSpecificationById(1).then((value) => {
                value.should.equal(testResponse)
                sinon.assert.calledWithExactly(
                    findStub,
                    1)
            })
        })

        it('fails and returns error when no strategy found', () => {
            findStub.resolves(null)

            return new UnitSpecificationService().getUnitSpecificationById(1).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Unit Specification Not Found for requested id')
                sinon.assert.calledWithExactly(
                    findStub,
                    1)
            })
        })

        it('fails when repo fails', () => {
            const testError = {
                'status': 500,
                'message': 'an error occurred'
            }
            findStub.rejects(testError)

            return new UnitSpecificationService().getUnitSpecificationById(1).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    findStub,
                    1)
            })
        })
    })

    describe('Get All Unit Specifications', () => {
        it('succeeds when repo succeeds', () => {
            const testResponse = {
                'response': [{id: 1, name: "Length"}, {id: 2, name: "Type"}]
            }
            allStub.resolves(testResponse)

            return new UnitSpecificationService().getAllUnitSpecifications().then((unitSpecs) => {
                unitSpecs.should.equal(testResponse)
                sinon.assert.called(
                    allStub)
            })
        })

        it('fails when repo fails', () => {
            const testError = {
                'status': 500,
                'message': 'an error occurred'
            }
            allStub.rejects(testError)

            return new UnitSpecificationService().getAllUnitSpecifications().should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.called(
                    allStub)
            })
        })
    })
})