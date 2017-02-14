const sinon = require('sinon')
const chai = require('chai')
const GroupTypeService = require('../../src/services/GroupTypeService')
const db = require('../../src/db/DbManager')

describe('GroupTypeService', () => {

    let findStub
    let allStub

    before(() => {
        findStub = sinon.stub(db.groupType, 'find')
        allStub = sinon.stub(db.groupType, 'all')
    })

    after(() => {
        findStub.restore()
        allStub.restore()
    })

    afterEach(() => {
        findStub.reset()
        allStub.reset()
    })

    describe('Get Group Type By ID', () => {
        it('succeeds and returns strategy when found', () => {
            const testResponse = {
                'response': 'test'
            }
            findStub.resolves(testResponse)

            return new GroupTypeService().getGroupTypeById(30).then((summary) => {
                summary.should.equal(testResponse)
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })

        it('fails and returns error when no strategy found', () => {
            findStub.resolves(null)

            return new GroupTypeService().getGroupTypeById(30).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Group Type Not Found for requested id')
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })

        it('fails when repo fails', () => {
            const testError = {
                'status': 500,
                'message': 'an error occurred'
            }
            findStub.rejects(testError)

            return new GroupTypeService().getGroupTypeById(30).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    findStub,
                    30)
            })
        })
    })

    describe('Get All Group Types', () => {
        it('succeeds when repo succeeds', () => {
            const testResponse = {
                'response': 'test'
            }
            allStub.resolves(testResponse)

            return new GroupTypeService().getAllGroupTypes().then((summary) => {
                summary.should.equal(testResponse)
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

            return new GroupTypeService().getAllGroupTypes().should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.called(
                    allStub)
            })
        })
    })
})