const sinon = require('sinon')
const chai = require('chai')
const FactorTypeService = require('../../src/services/factorTypeService')
const db = require('../../src/db/DbManager')

let getStub = undefined
let createStub = undefined
let findStub = undefined
let updateStub = undefined
let transactionStub = undefined
let deleteStub = undefined

before(() => {
    createStub = sinon.stub(db.factorType, 'create')
    getStub = sinon.stub(db.factorType, 'all')

    transactionStub = sinon.stub(db.factorType, 'repository', () => {
        return {tx: function(transactionName, callback){return callback()}}
    })
})

after(() => {
    if(getStub) { getStub.restore()}
    if(createStub) { createStub.restore()}
    if(findStub) { findStub.restore()}
    if(updateStub) { updateStub.restore()}
    if(deleteStub) { deleteStub.restore()}

    if(transactionStub) {transactionStub.restore()}
})

describe.only('FactorTypeService', () => {
    describe('createFactorType', () => {
        it('creates transaction and calls create method on repository', (done) => {
            createStub.resolves(1)
            const testObject = new FactorTypeService()
            testObject.createFactorType({'name': 'Independent Variable'}).then((result) => {
                result.should.equal(1)
                done()
            })
        })

        it('fails', (done) => {
            createStub.rejects({
                'status': 500,
                'code': 'Internal Server Error',
                'errorMessage': 'Please Contact Support'})

            const testObject = new FactorTypeService()

            testObject.createFactorType({
                'name': 'Independent Variable'
            }).should.be.rejected.and.notify(done)
        })
    })

    describe('getAllFactorTypes', () => {
        it('retrieves all', (done) => {
            getStub.resolves([
                {
                    'id': 1,
                    'name': 'Independent Variable'
                },
                {
                    'id': 2,
                    'name': 'Exogenous Variable'
                }
            ])

            const testObject = new FactorTypeService()

            testObject.getAllFactorTypes().then((types) => {
                types.length.should.equal(2)
                types[0]['id'].should.equal(1)
                types[0]['name'].should.equal("Independent Variable")
                types[1]['id'].should.equal(2)
                types[1]['name'].should.equal("Exogenous Variable")
            }).then(done, done)
        })
    })

    describe('getFactorTypeById', () => {

    })

    describe('updateFactorType', () => {

    })

    describe('deleteFactorType', () => {

    })
})