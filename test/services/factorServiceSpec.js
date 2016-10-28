import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
const sinon = require('sinon')
const chai = require('chai')
const FactorService = require('../../src/services/factorService')
const db = require('../../src/db/DbManager')

describe('FactorService', () => {
    let target

    const testFactors = []
    const testData = {}
    const testPostResponse = {}
    const testError = {}
    const tx = {}

    let createPostResponseStub
    let createPutResponseStub
    let notFoundStub
    let validateStub
    let repositoryStub
    let findStub
    let findByExperimentIdStub
    let allStub
    let batchCreateStub
    let batchUpdateStub
    let removeStub
    let findByBusinessKeyStub

    before(() => {
        target = new FactorService()

        createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
        createPutResponseStub = sinon.stub(AppUtil, 'createPutResponse')
        notFoundStub = sinon.stub(AppError, 'notFound')
        validateStub = sinon.stub(target._validator, 'validate')
        repositoryStub = sinon.stub(db.factor, 'repository', () => {
            return { tx: function (transactionName, callback) {return callback(tx)} }
        })
        findStub = sinon.stub(db.factor, 'find')
        findByExperimentIdStub = sinon.stub(db.factor, 'findByExperimentId')
        allStub = sinon.stub(db.factor, 'all')
        batchCreateStub = sinon.stub(db.factor, 'batchCreate')
        batchUpdateStub = sinon.stub(db.factor, 'batchUpdate')
        removeStub = sinon.stub(db.factor, 'remove')
        findByBusinessKeyStub = sinon.stub(db.factor, 'findByBusinessKey')
    })

    afterEach(() => {
        createPostResponseStub.reset()
        createPutResponseStub.reset()
        notFoundStub.reset()
        validateStub.reset()
        repositoryStub.reset()
        findStub.reset()
        findByExperimentIdStub.reset()
        allStub.reset()
        batchCreateStub.reset()
        batchUpdateStub.reset()
        removeStub.reset()
        findByBusinessKeyStub.reset()
    })

    after(() => {
        createPostResponseStub.restore()
        createPutResponseStub.restore()
        notFoundStub.restore()
        validateStub.restore()
        repositoryStub.restore()
        findStub.restore()
        findByExperimentIdStub.restore()
        allStub.restore()
        batchCreateStub.restore()
        batchUpdateStub.restore()
        removeStub.restore()
        findByBusinessKeyStub.restore()
    })

    describe('batchCreateFactors', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchCreateFactors(testFactors).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactors),
                    'POST')
                sinon.assert.notCalled(repositoryStub)
                sinon.assert.notCalled(batchCreateStub)
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns rejected promise when batchCreate fails', () => {
            validateStub.resolves()
            batchCreateStub.rejects(testError)

            return target.batchCreateFactors(testFactors).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactors),
                    'POST')
                sinon.assert.calledOnce(repositoryStub)
                sinon.assert.calledWith(batchCreateStub,
                    sinon.match.same(tx),
                    sinon.match.same(testFactors))
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchCreateStub.resolves(testData)
            createPostResponseStub.returns(testPostResponse)

            return target.batchCreateFactors(testFactors).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactors),
                    'POST')
                sinon.assert.calledOnce(repositoryStub)
                sinon.assert.calledWith(batchCreateStub,
                    sinon.match.same(tx),
                    sinon.match.same(testFactors))
                sinon.assert.calledWith(createPostResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('getAllFactors', () => {
        it('returns promise from factor repository all method', () => {
            const testPromise = {}
            allStub.returns(testPromise)

            target.getAllFactors().should.equal(testPromise)
        })
    })

    describe('getFactorsByExperimentId', () => {
        it('returns promise from findByExperimentId method', () => {
            const testPromise = {}
            findByExperimentIdStub.returns(testPromise)

            target.getFactorsByExperimentId(5).should.equal(testPromise)
            sinon.assert.calledWith(findByExperimentIdStub, 5)
        })
    })

    describe('getFactorById', () => {
        it('returns rejected promise when find fails', () => {
            findStub.rejects(testError)

            return target.getFactorById(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            findStub.resolves(null)
            notFoundStub.returns(testError)

            return target.getFactorById(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Factor Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            findStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.getFactorById(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Factor Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            findStub.resolves(testData)

            return target.getFactorById(7).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(findStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('batchUpdateFactors', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchUpdateFactors(testFactors).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactors),
                    'PUT')
                sinon.assert.notCalled(repositoryStub)
                sinon.assert.notCalled(batchUpdateStub)
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns rejected promise when batchCreate fails', () => {
            validateStub.resolves()
            batchUpdateStub.rejects(testError)

            return target.batchUpdateFactors(testFactors).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactors),
                    'PUT')
                sinon.assert.calledOnce(repositoryStub)
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(tx),
                    sinon.match.same(testFactors))
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchUpdateStub.resolves(testData)
            createPutResponseStub.returns(testPostResponse)

            return target.batchUpdateFactors(testFactors).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testFactors),
                    'PUT')
                sinon.assert.calledOnce(repositoryStub)
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(tx),
                    sinon.match.same(testFactors))
                sinon.assert.calledWith(createPutResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('deleteFactor', () => {
        it('returns rejected promise when remove fails', () => {
            removeStub.rejects(testError)

            return target.deleteFactor(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            removeStub.resolves(null)
            notFoundStub.returns(testError)

            return target.deleteFactor(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Factor Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            removeStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.deleteFactor(7).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Factor Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            removeStub.resolves(testData)

            return target.deleteFactor(7).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })
})