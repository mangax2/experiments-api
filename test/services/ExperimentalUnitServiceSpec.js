import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
const sinon = require('sinon')
const chai = require('chai')
const ExperimentalUnitService = require('../../src/services/ExperimentalUnitService')
const db = require('../../src/db/DbManager')

describe('ExperimentalUnitService', () => {
    let target
    const testExperimentalUnits = []
    const testData = {}
    const testPostResponse = {}
    const testError = {}
    const testContext = {}
    const tx = {tx: {}}

    let getTreatmentByIdStub
    let getExperimentByIdStub
    let batchGetTreatmentByIdsStub
    let createPostResponseStub
    let createPutResponseStub
    let notFoundStub
    let validateStub
    let repositoryStub
    let findStub
    let findAllByTreatmentIdStub
    let findAllByExperimentIdStub
    let batchFindAllByTreatmentIdsStub
    let batchCreateStub
    let batchUpdateStub
    let removeStub
    let batchRemoveStub

    before(() => {
        target = new ExperimentalUnitService()
        getTreatmentByIdStub = sinon.stub(target._treatmentService, 'getTreatmentById')
        getExperimentByIdStub = sinon.stub(target._experimentService, 'getExperimentById')

        batchGetTreatmentByIdsStub = sinon.stub(target._treatmentService, 'batchGetTreatmentByIds')
        createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
        createPutResponseStub = sinon.stub(AppUtil, 'createPutResponse')
        notFoundStub = sinon.stub(AppError, 'notFound')
        validateStub = sinon.stub(target._validator, 'validate')
        repositoryStub = sinon.stub(db.unit, 'repository', () => {
            return {
                tx: function (transactionName, callback) {
                    return callback(tx)
                }
            }
        })
        findStub = sinon.stub(db.unit, 'find')
        findAllByTreatmentIdStub = sinon.stub(db.unit, 'findAllByTreatmentId')
        findAllByExperimentIdStub = sinon.stub(db.unit, 'findAllByExperimentId')
        batchFindAllByTreatmentIdsStub = sinon.stub(db.unit, 'batchFindAllByTreatmentIds')
        batchCreateStub = sinon.stub(db.unit, 'batchCreate')
        batchUpdateStub = sinon.stub(db.unit, 'batchUpdate')
        removeStub = sinon.stub(db.unit, 'remove')
        batchRemoveStub = sinon.stub(db.unit, 'batchRemove')
    })

    afterEach(() => {
        getTreatmentByIdStub.reset()
        getExperimentByIdStub.reset()
        batchGetTreatmentByIdsStub.reset()
        createPostResponseStub.reset()
        createPutResponseStub.reset()
        notFoundStub.reset()
        validateStub.reset()
        repositoryStub.reset()
        findStub.reset()
        findAllByTreatmentIdStub.reset()
        batchFindAllByTreatmentIdsStub.reset()
        batchCreateStub.reset()
        batchUpdateStub.reset()
        removeStub.reset()
        batchRemoveStub.reset()
    })

    after(() => {
        getTreatmentByIdStub.restore()
        getExperimentByIdStub.restore()
        batchGetTreatmentByIdsStub.restore()
        createPostResponseStub.restore()
        createPutResponseStub.restore()
        notFoundStub.restore()
        validateStub.restore()
        repositoryStub.restore()
        findStub.restore()
        findAllByTreatmentIdStub.restore()
        batchFindAllByTreatmentIdsStub.restore()
        batchCreateStub.restore()
        batchUpdateStub.restore()
        removeStub.restore()
        batchRemoveStub.restore()
    })

    describe('batchCreateExperimentalUnits', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchCreateExperimentalUnits(testExperimentalUnits, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testExperimentalUnits),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.notCalled(batchCreateStub)
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns rejected promise when batchCreate fails', () => {
            validateStub.resolves()
            batchCreateStub.rejects(testError)

            return target.batchCreateExperimentalUnits(testExperimentalUnits, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(validateStub,
                    sinon.match.same(testExperimentalUnits),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.calledWithExactly(batchCreateStub,
                    sinon.match.same(testExperimentalUnits),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchCreateStub.resolves(testData)
            createPostResponseStub.returns(testPostResponse)

            return target.batchCreateExperimentalUnits(testExperimentalUnits, testContext, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWithExactly(validateStub,
                    sinon.match.same(testExperimentalUnits),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.calledWithExactly(batchCreateStub,
                    sinon.match.same(testExperimentalUnits),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.calledWith(createPostResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('batchGetExperimentalUnitsByTreatmentIds', () => {
        it('returns rejected promise when batchGetTreatmentByIds fails', () => {
            batchGetTreatmentByIdsStub.rejects(testError)

            return target.batchGetExperimentalUnitsByTreatmentIds([1], tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledOnce(batchGetTreatmentByIdsStub)
                sinon.assert.calledWithExactly(
                    batchGetTreatmentByIdsStub,
                    [1],
                    sinon.match.same(tx)
                )
                sinon.assert.notCalled(batchFindAllByTreatmentIdsStub)
            })
        })

        it('returns rejected promise when batchFindAllByTreatmentIds fails', () => {
            batchGetTreatmentByIdsStub.resolves()
            batchFindAllByTreatmentIdsStub.rejects(testError)

            return target.batchGetExperimentalUnitsByTreatmentIds([1], tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledOnce(batchGetTreatmentByIdsStub)
                sinon.assert.calledWithExactly(
                    batchGetTreatmentByIdsStub,
                    [1],
                    sinon.match.same(tx)
                )
                sinon.assert.calledOnce(batchFindAllByTreatmentIdsStub)
                sinon.assert.calledWithExactly(
                    batchFindAllByTreatmentIdsStub,
                    [1],
                    sinon.match.same(tx)
                )
            })
        })

        it('returns resolved promise when calls succeed', () => {
            batchGetTreatmentByIdsStub.resolves()
            batchFindAllByTreatmentIdsStub.resolves(testData)

            return target.batchGetExperimentalUnitsByTreatmentIds([1], tx).then((data) => {
                data.should.equal(testData)
                sinon.assert.calledOnce(batchGetTreatmentByIdsStub)
                sinon.assert.calledWithExactly(
                    batchGetTreatmentByIdsStub,
                    [1],
                    sinon.match.same(tx)
                )
                sinon.assert.calledOnce(batchFindAllByTreatmentIdsStub)
                sinon.assert.calledWithExactly(
                    batchFindAllByTreatmentIdsStub,
                    [1],
                    sinon.match.same(tx)
                )
            })
        })
    })

    describe('getExperimentalUnitsByTreatmentId', () => {
        it('returns rejected promise when getByTreatmentId fails', () => {
            getTreatmentByIdStub.rejects(testError)
            return target.getExperimentalUnitsByTreatmentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getTreatmentByIdStub, 7, tx)
                sinon.assert.notCalled(findAllByTreatmentIdStub)
            })
        })

        it('returns rejected promise when getByTreatmentId fails', () => {
            getTreatmentByIdStub.resolves()
            findAllByTreatmentIdStub.rejects(testError)

            return target.getExperimentalUnitsByTreatmentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getTreatmentByIdStub, 7, tx)
                sinon.assert.calledWith(findAllByTreatmentIdStub, 7, tx)
            })
        })

        it('returns resolved promise from getByTreatmentId method upon success', () => {
            getTreatmentByIdStub.resolves()
            findAllByTreatmentIdStub.resolves(testData)

            return target.getExperimentalUnitsByTreatmentId(7, tx).then((data) => {
                data.should.equal(testData)
                sinon.assert.calledWith(getTreatmentByIdStub, 7, tx)
                sinon.assert.calledWith(findAllByTreatmentIdStub, 7, tx)
            })
        })
    })

    describe('getExperimentalUnitsByExperimentId', () => {
        it('returns rejected promise when getByExperimentId fails', () => {
            getExperimentByIdStub.rejects(testError)
            return target.getExperimentalUnitsByExperimentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getExperimentByIdStub, 7, tx)
                sinon.assert.notCalled(findAllByExperimentIdStub)
            })
        })

        it('returns rejected promise when getByExperimentId fails', () => {
            getExperimentByIdStub.resolves()
            findAllByExperimentIdStub.rejects(testError)

            return target.getExperimentalUnitsByExperimentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(getExperimentByIdStub, 7, tx)
                sinon.assert.calledWith(findAllByExperimentIdStub, 7, tx)
            })
        })

        it('returns resolved promise from getByExperimentId method upon success', () => {
            getExperimentByIdStub.resolves()
            findAllByExperimentIdStub.resolves(testData)

            return target.getExperimentalUnitsByExperimentId(7, tx).then((data) => {
                data.should.equal(testData)
                sinon.assert.calledWith(getExperimentByIdStub, 7, tx)
                sinon.assert.calledWith(findAllByExperimentIdStub, 7, tx)
            })
        })
    })

    describe('getExperimentalUnitById', () => {
        it('returns rejected promise when find fails', () => {
            findStub.rejects(testError)

            return target.getExperimentalUnitById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7, tx)
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            findStub.resolves(null)
            notFoundStub.returns(testError)

            return target.getExperimentalUnitById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7, tx)
                sinon.assert.calledWith(notFoundStub, 'Experimental Unit Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            findStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.getExperimentalUnitById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(findStub, 7, tx)
                sinon.assert.calledWith(notFoundStub, 'Experimental Unit Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            findStub.resolves(testData)
            return target.getExperimentalUnitById(7, tx).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(findStub, 7, tx)
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('batchUpdateExperimentalUnits', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchUpdateExperimentalUnits(testExperimentalUnits, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testExperimentalUnits),
                    'PUT')
                sinon.assert.notCalled(repositoryStub)
                sinon.assert.notCalled(batchUpdateStub)
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns rejected promise when batchUpdate fails', () => {
            validateStub.resolves()
            batchUpdateStub.rejects(testError)

            return target.batchUpdateExperimentalUnits(testExperimentalUnits, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testExperimentalUnits),
                    'PUT')
                sinon.assert.calledWith(batchUpdateStub,

                    sinon.match.same(testExperimentalUnits),
                    sinon.match.same(tx)
                )
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchUpdateStub.resolves(testData)
            createPutResponseStub.returns(testPostResponse)

            return target.batchUpdateExperimentalUnits(testExperimentalUnits, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testExperimentalUnits),
                    'PUT')
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(testExperimentalUnits),
                    sinon.match.same(tx))
                sinon.assert.calledWith(createPutResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('deleteExperimentalUnit', () => {
        it('returns rejected promise when remove fails', () => {
            removeStub.rejects(testError)

            return target.deleteExperimentalUnit(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            removeStub.resolves(null)
            notFoundStub.returns(testError)

            return target.deleteExperimentalUnit(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Experimental Unit Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            removeStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.deleteExperimentalUnit(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.calledWith(notFoundStub, 'Experimental Unit Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            removeStub.resolves(testData)

            return target.deleteExperimentalUnit(7, tx).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(removeStub, 7)
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('batchDeleteExperimentalUnits', () => {
        it('returns rejected promise when batchRemove fails', () => {
            batchRemoveStub.rejects(testError)

            return target.batchDeleteExperimentalUnits([1], tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledOnce(batchRemoveStub)
                sinon.assert.calledWithExactly(
                    batchRemoveStub,
                    [1],
                    sinon.match.same(tx)
                )
            })
        })

        it('returns rejected promise when found count not equal to id count', () => {
            batchRemoveStub.resolves([{}, null, {}])
            notFoundStub.returns(testError)

            return target.batchDeleteExperimentalUnits([1,2,3], tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledOnce(batchRemoveStub)
                sinon.assert.calledWithExactly(
                    batchRemoveStub,
                    [1,2,3],
                    sinon.match.same(tx)
                )
                sinon.assert.calledOnce(notFoundStub)
                sinon.assert.calledWithExactly(
                    notFoundStub,
                    'Not all experimental units requested for delete were found'
                )
            })
        })

        it('returns resolved promise when an element is found for each id', () => {
            const removalResult = [{}, {}, {}]
            batchRemoveStub.resolves(removalResult)
            notFoundStub.returns(testError)

            return target.batchDeleteExperimentalUnits([1,2,3], tx).then((data) => {
                data.should.equal(removalResult)
                sinon.assert.calledOnce(batchRemoveStub)
                sinon.assert.calledWithExactly(
                    batchRemoveStub,
                    [1,2,3],
                    sinon.match.same(tx)
                )
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })
})