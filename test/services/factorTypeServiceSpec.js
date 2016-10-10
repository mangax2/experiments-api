const sinon = require('sinon')
const FactorTypeService = require('../../src/services/factorTypeService')
const db = require('../../src/db/DbManager')

const testPayload = {}
const testResponse = {}
const testError = {}
const tx = {}

let createStub
let deleteStub
let factorTypesService
let findStub
let getStub
let transactionStub
let updateStub
let validateStub

before(() => {
    createStub = sinon.stub(db.factorType, 'create')
    deleteStub = sinon.stub(db.factorType, 'delete')
    factorTypesService = new FactorTypeService()
    findStub = sinon.stub(db.factorType, 'find')
    getStub = sinon.stub(db.factorType, 'all')
    transactionStub = sinon.stub(db.factorType, 'repository', () => {
        return {tx: function(transactionName, callback){return callback(tx)}}
    })
    updateStub = sinon.stub(db.factorType, 'update')
    validateStub = sinon.stub(factorTypesService._validator, 'validate')
})

afterEach(() => {
    createStub.reset()
    deleteStub.reset()
    findStub.reset()
    getStub.reset()
    transactionStub.reset()
    updateStub.reset()
    validateStub.reset()

})

after(() => {
    createStub.restore()
    deleteStub.restore()
    findStub.restore()
    getStub.restore()
    transactionStub.restore()
    updateStub.restore()
    validateStub.restore()
})

describe('FactorTypeService', () => {
    describe('createFactorType', () => {
        it('creates transaction and calls create method on repository', () => {
            createStub.resolves(1)
            validateStub.resolves()

            return factorTypesService.createFactorType(testPayload, 'pnwatt').then((result) => {
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
            validateStub.resolves()

            return factorTypesService.createFactorType(testPayload, 'pnwatt').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(
                    createStub,
                    sinon.match.same(tx),
                    sinon.match.same(testPayload),
                    'pnwatt')
                err.should.equal(testError)
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects()

            return factorTypesService.createFactorType(testPayload, 'pnwatt').should.be.rejected.then((err) => {
                createStub.called.should.equal(false)
            })
        })
    })

    describe('getAllFactorTypes', () => {
        it('retrieves all', () => {
            getStub.resolves(testResponse)

            return factorTypesService.getAllFactorTypes().then((types) => {
                sinon.assert.calledOnce(getStub)
                types.should.equal(testResponse)
            })
        })
    })

    describe('getFactorTypeById', () => {
        it('successfully gets factor type with id 1', () => {
            findStub.resolves(testResponse)

            return factorTypesService.getFactorTypeById(1).then((result) => {
                sinon.assert.calledWithExactly(findStub, 1)
                result.should.equal(testResponse)
            })
        })

        it('fails', () => {
            findStub.rejects(testError)

            return factorTypesService.getFactorTypeById(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(findStub, 1)
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            findStub.resolves(null)

            return factorTypesService.getFactorTypeById(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(findStub, 1)
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Factor Type Not Found")
            })
        })
    })

    describe('updateFactorType', () => {
        it('successfully updates factor type with id 1', () => {
            updateStub.resolves(testResponse)
            validateStub.resolves()

            return factorTypesService.updateFactorType(1, testPayload, 'pnwatt').then((result) => {
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
            validateStub.resolves()

            return factorTypesService.updateFactorType(1, testPayload, 'pnwatt').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(updateStub, tx, 1, sinon.match.same(testPayload), 'pnwatt')
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            updateStub.resolves(null)
            validateStub.resolves()

            return factorTypesService.updateFactorType(1, testPayload, 'pnwatt').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(updateStub, tx, 1, sinon.match.same(testPayload), 'pnwatt')
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Factor Type Not Found")
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects()

            return factorTypesService.updateFactorType(1, testPayload, 'pnwatt').should.be.rejected.then((err) => {
                updateStub.called.should.equal(false)
            })
        })
    })

    describe('deleteFactorType', () => {
        it('deletes an factor type and returns the deleted id', () => {
            deleteStub.resolves(1)

            return factorTypesService.deleteFactorType(1).then((value) =>{
                sinon.assert.calledWithExactly(deleteStub, tx, 1)
                value.should.equal(1)
            })
        })

        it('fails', () => {
            deleteStub.rejects(testError)

            return factorTypesService.deleteFactorType(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(deleteStub, tx, 1)
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            deleteStub.resolves(null)

            return factorTypesService.deleteFactorType(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(deleteStub, tx, 1)
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Factor Type Not Found")
            })
        })
    })
})