import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
const sinon = require('sinon')
const chai = require('chai')
const FactorLevelService = require('../../src/services/FactorLevelService')
const db = require('../../src/db/DbManager')

describe('FactorLevelService', () => {
    let target

    const testFactorLevels = []
    const testData = {}
    const testPostResponse = {}
    const testError = {}
    const tx = {tx: {}}

    let getFactorByIdStub
    let createPostResponseStub
    let createPutResponseStub
    let notFoundStub
    let validateStub
    let repositoryStub
    let findStub
    let findByFactorIdStub
    let allStub
    let batchCreateStub
    let batchUpdateStub
    let removeStub
    let findByBusinessKeyStub

    before(() => {
        target = new FactorLevelService()

        getFactorByIdStub = sinon.stub(target._factorService, 'getFactorById')
        createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
        createPutResponseStub = sinon.stub(AppUtil, 'createPutResponse')
        notFoundStub = sinon.stub(AppError, 'notFound')
        validateStub = sinon.stub(target._validator, 'validate')
        repositoryStub = sinon.stub(db.factorLevel, 'repository', () => {
            return { tx: function (transactionName, callback) {return callback(tx)} }
        })
        findStub = sinon.stub(db.factorLevel, 'find')
        findByFactorIdStub = sinon.stub(db.factorLevel, 'findByFactorId')
        allStub = sinon.stub(db.factorLevel, 'all')
        batchCreateStub = sinon.stub(db.factorLevel, 'batchCreate')
        batchUpdateStub = sinon.stub(db.factorLevel, 'batchUpdate')
        removeStub = sinon.stub(db.factorLevel, 'remove')
        findByBusinessKeyStub = sinon.stub(db.factorLevel, 'findByBusinessKey')
    })

    afterEach(() => {
        getFactorByIdStub.reset()
        createPostResponseStub.reset()
        createPutResponseStub.reset()
        notFoundStub.reset()
        validateStub.reset()
        repositoryStub.reset()
        findStub.reset()
        findByFactorIdStub.reset()
        allStub.reset()
        batchCreateStub.reset()
        batchUpdateStub.reset()
        removeStub.reset()
        findByBusinessKeyStub.reset()
    })

    after(() => {
        getFactorByIdStub.restore()
        createPostResponseStub.restore()
        createPutResponseStub.restore()
        notFoundStub.restore()
        validateStub.restore()
        repositoryStub.restore()
        findStub.restore()
        findByFactorIdStub.restore()
        allStub.restore()
        batchCreateStub.restore()
        batchUpdateStub.restore()
        removeStub.restore()
        findByBusinessKeyStub.restore()
    })

    describe('batchCreateFactorLevels', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchCreateFactorLevels(testFactorLevels).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactorLevels),
                    'POST')
                sinon.assert.notCalled(batchCreateStub)
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns rejected promise when batchCreate fails', () => {
            validateStub.resolves()
            batchCreateStub.rejects(testError)

            return target.batchCreateFactorLevels(testFactorLevels, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(validateStub,
                    sinon.match.same(testFactorLevels),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.calledWithExactly(batchCreateStub,
                    sinon.match.same(tx),
                    sinon.match.same(testFactorLevels))
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchCreateStub.resolves(testData)
            createPostResponseStub.returns(testPostResponse)

            return target.batchCreateFactorLevels(testFactorLevels, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactorLevels),
                    'POST')
                sinon.assert.calledWith(batchCreateStub,
                    sinon.match.same(tx),
                    sinon.match.same(testFactorLevels))
                sinon.assert.calledWith(createPostResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('getAllFactorLevels', () => {
        it('returns promise from factor repository all method', () => {
            const testPromise = {}
            allStub.returns(testPromise)

            target.getAllFactorLevels().should.equal(testPromise)
        })
    })

    describe('getFactorLevelsByFactorId', () => {
        it('returns rejected promise when getByFactorId fails', () => {
            getFactorByIdStub.rejects(testError)

            return target.getFactorLevelsByFactorId(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getFactorByIdStub, 7)
                sinon.assert.notCalled(findByFactorIdStub)
            })
        })

        it('returns rejected promise when getByFactorId fails', () => {
            getFactorByIdStub.resolves()
            findByFactorIdStub.rejects(testError)

            return target.getFactorLevelsByFactorId(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getFactorByIdStub, 7)
                sinon.assert.calledWith(findByFactorIdStub, 7)
            })
        })

        it('returns resolved promise from getByFactorId method upon success', () => {
            getFactorByIdStub.resolves()
            findByFactorIdStub.resolves(testData)

            return target.getFactorLevelsByFactorId(7).then((data) => {
                data.should.equal(testData)
                sinon.assert.calledWith(getFactorByIdStub, 7)
                sinon.assert.calledWith(findByFactorIdStub, 7)
            })
        })
    })

    describe('getFactorLevelById', () => {
        it('returns rejected promise when find fails', () => {
            findStub.rejects(testError)

            return target.getFactorLevelById(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            findStub.resolves(null)
            notFoundStub.returns(testError)

            return target.getFactorLevelById(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Factor Level Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            findStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.getFactorLevelById(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Factor Level Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            findStub.resolves(testData)

            return target.getFactorLevelById(7).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(findStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('batchUpdateFactorLevels', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchUpdateFactorLevels(testFactorLevels).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactorLevels),
                    'PUT')
                sinon.assert.notCalled(repositoryStub)
                sinon.assert.notCalled(batchUpdateStub)
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns rejected promise when batchUpdate fails', () => {
            validateStub.resolves()
            batchUpdateStub.rejects(testError)

            return target.batchUpdateFactorLevels(testFactorLevels).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactorLevels),
                    'PUT')
                sinon.assert.calledOnce(repositoryStub)
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(tx),
                    sinon.match.same(testFactorLevels))
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchUpdateStub.resolves(testData)
            createPutResponseStub.returns(testPostResponse)

            return target.batchUpdateFactorLevels(testFactorLevels).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactorLevels),
                    'PUT')
                sinon.assert.calledOnce(repositoryStub)
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(tx),
                    sinon.match.same(testFactorLevels))
                sinon.assert.calledWith(createPutResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('deleteFactorLevel', () => {
        it('returns rejected promise when remove fails', () => {
            removeStub.rejects(testError)

            return target.deleteFactorLevel(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            removeStub.resolves(null)
            notFoundStub.returns(testError)

            return target.deleteFactorLevel(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Factor Level Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            removeStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.deleteFactorLevel(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Factor Level Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            removeStub.resolves(testData)

            return target.deleteFactorLevel(7).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })
})