const sinon = require('sinon')
const chai = require('chai')
const FactorTypeService = require('../../src/services/factorTypeService')
const db = require('../../src/db/DbManager')

const getStub = sinon.stub(db.factorType, 'all')
const createStub = sinon.stub(db.factorType, 'create')
const findStub = sinon.stub(db.factorType, 'find')
const updateStub = sinon.stub(db.factorType, 'update')
const deleteStub = sinon.stub(db.factorType, 'delete')
const transactionStub = sinon.stub(db.factorType, 'repository', () => {
    return {tx: function(transactionName, callback){return callback()}}
})

after(() => {
    getStub.restore()
    createStub.restore()
    findStub.restore()
    updateStub.restore()
    deleteStub.restore()
    transactionStub.restore()
})

describe.only('FactorTypeService', () => {
    describe('createFactorType', () => {
        it('creates transaction and calls create method on repository', (done) => {
            createStub.resolves(1)
            const testObject = new FactorTypeService()
            testObject.createFactorType({'type': 'Independent Variable'}).then((result) => {
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
                'type': 'Independent Variable'
            }).should.be.rejected.and.notify(done)
        })
    })

    describe('getAllFactorTypes', () => {
        it('retrieves all', (done) => {
            getStub.resolves([
                {
                    'id': 1,
                    'type': 'Independent Variable'
                },
                {
                    'id': 2,
                    'type': 'Exogenous Variable'
                }
            ])

            const testObject = new FactorTypeService()

            testObject.getAllFactorTypes().then((types) => {
                types.length.should.equal(2)
                types[0]['id'].should.equal(1)
                types[0]['type'].should.equal("Independent Variable")
                types[1]['id'].should.equal(2)
                types[1]['type'].should.equal("Exogenous Variable")
            }).then(done, done)
        })
    })

    describe('getFactorTypeById', () => {
        it('successfully gets factor type with id 1', (done) => {
            findStub.resolves({'id': 1, 'type': 'Independent Variable'})

            const testObject = new FactorTypeService()
            testObject.getFactorTypeById(1).then((result) => {
                result.id.should.equal(1)
                result.type.should.equal('Independent Variable')
            }).then(done, done)
        })

        it('fails', (done) => {
            findStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

            const testObject = new FactorTypeService()
            testObject.getFactorTypeById(1).should.be.rejected.and.notify(done)
        })
    })

    describe('updateFactorType', () => {

    })

    describe('deleteFactorType', () => {

    })
})