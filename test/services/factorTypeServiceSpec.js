const sinon = require('sinon')
const FactorTypeService = require('../../src/services/factorTypeService')
const db = require('../../src/db/DbManager')

const testPayload = {}
const testResponse = {}
const testError = {}
const tx = {}

let getStub
let createStub
let findStub
let updateStub
let deleteStub
let transactionStub

before(() => {
    getStub = sinon.stub(db.factorType, 'all')
    createStub = sinon.stub(db.factorType, 'create')
    findStub = sinon.stub(db.factorType, 'find')
    updateStub = sinon.stub(db.factorType, 'update')
    deleteStub = sinon.stub(db.factorType, 'delete')
    transactionStub = sinon.stub(db.factorType, 'repository', () => {
        return {tx: function(transactionName, callback){return callback(tx)}}
    })
})

after(() => {
    getStub.restore()
    createStub.restore()
    findStub.restore()
    updateStub.restore()
    deleteStub.restore()
    transactionStub.restore()
})

describe('FactorTypeService', () => {
    describe('createFactorType', () => {
        it('creates transaction and calls create method on repository', () => {
            createStub.resolves(1)
            const testObject = new FactorTypeService()

            return testObject.createFactorType(testPayload, 'pnwatt').then((result) => {
                result.should.equal(1)
                sinon.assert.calledWithExactly(
                    createStub,
                    sinon.match.same(tx),
                    sinon.match.same(testPayload),
                    'pnwatt')
            })
        })

        it('fails', () => {
            createStub.rejects(testError)
            const testObject = new FactorTypeService()

            return testObject.createFactorType(testPayload).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(
                    createStub,
                    sinon.match.same(tx),
                    sinon.match.same(testPayload),
                    'pnwatt')
                err.should.equal(testError)
            })
        })
    })

    describe('getAllFactorTypes', () => {
        it('retrieves all', () => {
            getStub.resolves(testResponse)

            const testObject = new FactorTypeService()

            return testObject.getAllFactorTypes().then((types) => {
                sinon.assert.calledOnce(getStub)
                types.should.equal(testResponse)
            })
        })
    })

    describe('getFactorTypeById', () => {
        it('successfully gets factor type with id 1', () => {
            findStub.resolves(testResponse)

            const testObject = new FactorTypeService()
            return testObject.getFactorTypeById(1).then((result) => {
                sinon.assert.calledWithExactly(findStub, 1)
                result.should.equal(testResponse)
            })
        })

        it('fails', () => {
            findStub.rejects(testError)

            const testObject = new FactorTypeService()
            return testObject.getFactorTypeById(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(findStub, 1)
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            findStub.resolves(null)

            const testObject = new FactorTypeService()
            return testObject.getFactorTypeById(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(findStub, 1)
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Factor Type Not Found")
            })
        })
    })

    describe('updateFactorType', () => {
        it('successfully updates factor type with id 1', () => {
            updateStub.resolves(testResponse)

            const testObject = new FactorTypeService()
            return testObject.updateFactorType(1, testPayload, 'pnwatt').then((result) => {
                sinon.assert.calledWithExactly(
                    updateStub,
                    sinon.match.same(tx),
                    1,
                    sinon.match.same(testPayload),
                    'pnwatt')
                result.should.equal(testResponse)
            })
        })

        it('fails', () => {
            updateStub.rejects(testError)

            const testObject = new FactorTypeService()
            return testObject.updateFactorType(1, testPayload, 'pnwatt').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(updateStub, tx, 1, sinon.match.same(testPayload), 'pnwatt')
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            updateStub.resolves(null)

            const testObject = new FactorTypeService()
            return testObject.updateFactorType(1, testPayload, 'pnwatt').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(updateStub, tx, 1, sinon.match.same(testPayload), 'pnwatt')
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Factor Type Not Found")
            })
        })
    })

    describe('deleteFactorType', () => {
        it('deletes an factor type and returns the deleted id', () => {
            deleteStub.resolves(1)

            const testObject = new FactorTypeService()
            return testObject.deleteFactorType(1).then((value) =>{
                sinon.assert.calledWithExactly(deleteStub, tx, 1)
                value.should.equal(1)
            })
        })

        it('fails', () => {
            deleteStub.rejects(testError)

            const testObject = new FactorTypeService()
            return testObject.deleteFactorType(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(deleteStub, tx, 1)
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            deleteStub.resolves(null)

            const testObject = new FactorTypeService()
            return testObject.deleteFactorType(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(deleteStub, tx, 1)
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Factor Type Not Found")
            })
        })
    })
})