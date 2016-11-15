import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
const sinon = require('sinon')
const chai = require('chai')
const CombinationElementService = require('../../src/services/CombinationElementService')
const db = require('../../src/db/DbManager')

describe('CombinationElementService', () => {
    let target
    const testCombinationElemenets = []
    const testData = {}
    const testPostResponse = {}
    const testError = {}
    const testContext = {}
    const tx = {tx: {}}

    let getTreatmentByIdStub
    let createPostResponseStub
    let createPutResponseStub
    let notFoundStub
    let validateStub
    let repositoryStub
    let findStub
    let findAllByTreatmentIdStub
    let batchCreateStub
    let batchUpdateStub
    let removeStub
    let findByBusinessKeyStub

    before(() => {
        target = new CombinationElementService()

        getTreatmentByIdStub = sinon.stub(target._treatmentService, 'getTreatmentById')
        createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
        createPutResponseStub = sinon.stub(AppUtil, 'createPutResponse')
        notFoundStub = sinon.stub(AppError, 'notFound')
        validateStub = sinon.stub(target._validator, 'validate')
        repositoryStub = sinon.stub(db.combinationElement, 'repository', () => {
            return {
                tx: function (transactionName, callback) {
                    return callback(tx)
                }
            }
        })
        findStub = sinon.stub(db.combinationElement, 'find')
        findAllByTreatmentIdStub = sinon.stub(db.combinationElement, 'findAllByTreatmentId')
        batchCreateStub = sinon.stub(db.combinationElement, 'batchCreate')
        batchUpdateStub = sinon.stub(db.combinationElement, 'batchUpdate')
        removeStub = sinon.stub(db.combinationElement, 'remove')
        findByBusinessKeyStub = sinon.stub(db.combinationElement, 'findByBusinessKey')
    })

    afterEach(() => {
        getTreatmentByIdStub.reset()
        createPostResponseStub.reset()
        createPutResponseStub.reset()
        notFoundStub.reset()
        validateStub.reset()
        repositoryStub.reset()
        findStub.reset()
        findAllByTreatmentIdStub.reset()
        batchCreateStub.reset()
        batchUpdateStub.reset()
        removeStub.reset()
        findByBusinessKeyStub.reset()
    })

    after(() => {
        getTreatmentByIdStub.restore()
        createPostResponseStub.restore()
        createPutResponseStub.restore()
        notFoundStub.restore()
        validateStub.restore()
        repositoryStub.restore()
        findStub.restore()
        findAllByTreatmentIdStub.restore()
        batchCreateStub.restore()
        batchUpdateStub.restore()
        removeStub.restore()
        findByBusinessKeyStub.restore()
    })

    describe('batchCreateCombinationElements', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchCreateCombinationElements(testCombinationElemenets, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testCombinationElemenets),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.notCalled(batchCreateStub)
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns rejected promise when batchCreate fails', () => {
            validateStub.resolves()
            batchCreateStub.rejects(testError)

            return target.batchCreateCombinationElements(testCombinationElemenets, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(validateStub,
                    sinon.match.same(testCombinationElemenets),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.calledWithExactly(batchCreateStub,
                    sinon.match.same(testCombinationElemenets),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchCreateStub.resolves(testData)
            createPostResponseStub.returns(testPostResponse)

            return target.batchCreateCombinationElements(testCombinationElemenets, testContext, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWithExactly(validateStub,
                    sinon.match.same(testCombinationElemenets),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.calledWithExactly(batchCreateStub,
                    sinon.match.same(testCombinationElemenets),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.calledWith(createPostResponseStub,
                    sinon.match.same(testData))
            })
        })
    })


    describe('getCombinationElementsByTreatmentId', () => {
        it('returns rejected promise when getByTreatmentId fails', () => {
            getTreatmentByIdStub.rejects(testError)
            return target.getCombinationElementsByTreatmentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getTreatmentByIdStub, 7, tx)
                sinon.assert.notCalled(findAllByTreatmentIdStub)
            })
        })

        it('returns rejected promise when getByTreatmentId fails', () => {
            getTreatmentByIdStub.resolves()
            findAllByTreatmentIdStub.rejects(testError)

            return target.getCombinationElementsByTreatmentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getTreatmentByIdStub, 7, tx)
                sinon.assert.calledWith(findAllByTreatmentIdStub, 7, tx)
            })
        })

        it('returns resolved promise from getByTreatmentId method upon success', () => {
            getTreatmentByIdStub.resolves()
            findAllByTreatmentIdStub.resolves(testData)

            return target.getCombinationElementsByTreatmentId(7, tx).then((data) => {
                data.should.equal(testData)
                sinon.assert.calledWith(getTreatmentByIdStub, 7, tx)
                sinon.assert.calledWith(findAllByTreatmentIdStub, 7, tx)
            })
        })
    })

    describe('getCombinationElementsById', () => {
        it('returns rejected promise when find fails', () => {
            findStub.rejects(testError)

            return target.getCombinationElementById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7, tx)
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            findStub.resolves(null)
            notFoundStub.returns(testError)

            return target.getCombinationElementById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7, tx)
                sinon.assert.calledWith(notFoundStub, 'Combination Element Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            findStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.getCombinationElementById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7, tx)
                sinon.assert.calledWith(notFoundStub, 'Combination Element Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            findStub.resolves(testData)

            return target.getCombinationElementById(7, tx).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(findStub, 7, tx)
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('batchUpdateCombinationElements', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchUpdateCombinationElements(testCombinationElemenets, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testCombinationElemenets),
                    'PUT')
                sinon.assert.notCalled(repositoryStub)
                sinon.assert.notCalled(batchUpdateStub)
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns rejected promise when batchUpdate fails', () => {
            validateStub.resolves()
            batchUpdateStub.rejects(testError)

            return target.batchUpdateCombinationElements(testCombinationElemenets, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testCombinationElemenets),
                    'PUT')
                sinon.assert.calledWith(batchUpdateStub,

                    sinon.match.same(testCombinationElemenets),
                    sinon.match.same(tx)
                )
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchUpdateStub.resolves(testData)
            createPutResponseStub.returns(testPostResponse)

            return target.batchUpdateCombinationElements(testCombinationElemenets, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testCombinationElemenets),
                    'PUT')
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(testCombinationElemenets),
                    sinon.match.same(tx))
                sinon.assert.calledWith(createPutResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('deleteCombinationElement', () => {
        it('returns rejected promise when remove fails', () => {
            removeStub.rejects(testError)

            return target.deleteCombinationElement(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            removeStub.resolves(null)
            notFoundStub.returns(testError)

            return target.deleteCombinationElement(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Combination Element Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            removeStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.deleteCombinationElement(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Combination Element Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            removeStub.resolves(testData)

            return target.deleteCombinationElement(7, tx).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })
})