import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
const sinon = require('sinon')
const TreatmentService = require('../../src/services/TreatmentService')
const db = require('../../src/db/DbManager')

describe('TreatmentService', () => {

    let target

    const testTreatments = []
    const testData = {}
    const testPostResponse = {}
    const testError = {}
    const testContext = {}
    const tx = {tx: {}}

    let getExperimentByIdStub
    let createPostResponseStub
    let createPutResponseStub
    let notFoundStub
    let validateStub
    let findStub
    let findAllByExperimentIdStub
    let batchCreateStub
    let batchUpdateStub
    let removeStub
    let removeByExperimentIdStub

    before(() => {
        target = new TreatmentService()

        getExperimentByIdStub = sinon.stub(target._experimentService, 'getExperimentById')
        createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
        createPutResponseStub = sinon.stub(AppUtil, 'createPutResponse')
        notFoundStub = sinon.stub(AppError, 'notFound')
        validateStub = sinon.stub(target._validator, 'validate')
        findStub = sinon.stub(db.treatment, 'find')
        findAllByExperimentIdStub = sinon.stub(db.treatment, 'findAllByExperimentId')
        batchCreateStub = sinon.stub(db.treatment, 'batchCreate')
        batchUpdateStub = sinon.stub(db.treatment, 'batchUpdate')
        removeStub = sinon.stub(db.treatment, 'remove')
        removeByExperimentIdStub = sinon.stub(db.treatment, 'removeByExperimentId')
    })

    afterEach(() => {
        getExperimentByIdStub.reset()
        createPostResponseStub.reset()
        createPutResponseStub.reset()
        notFoundStub.reset()
        validateStub.reset()
        findStub.reset()
        findAllByExperimentIdStub.reset()
        batchCreateStub.reset()
        batchUpdateStub.reset()
        removeStub.reset()
        removeByExperimentIdStub.reset()
    })

    after(() => {
        getExperimentByIdStub.restore()
        createPostResponseStub.restore()
        createPutResponseStub.restore()
        notFoundStub.restore()
        validateStub.restore()
        findStub.restore()
        findAllByExperimentIdStub.restore()
        batchCreateStub.restore()
        batchUpdateStub.restore()
        removeStub.restore()
        removeByExperimentIdStub.restore()
    })

    describe('batchCreateTreatments', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchCreateTreatments(testTreatments, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testTreatments),
                    'POST')
                sinon.assert.notCalled(batchCreateStub)
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns rejected promise when batchCreate fails', () => {
            validateStub.resolves()
            batchCreateStub.rejects(testError)

            return target.batchCreateTreatments(testTreatments, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testTreatments),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.calledWith(batchCreateStub,
                    sinon.match.same(testTreatments),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchCreateStub.resolves(testData)
            createPostResponseStub.returns(testPostResponse)

            return target.batchCreateTreatments(testTreatments, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testTreatments),
                    'POST')
                sinon.assert.calledWith(batchCreateStub,
                    sinon.match.same(testTreatments),
                    sinon.match.same(tx))
                sinon.assert.calledWith(createPostResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('getTreatmentsByExperimentId', () => {
        it('returns rejected promise when getExperimentById fails', () => {
            getExperimentByIdStub.rejects(testError)

            return target.getTreatmentsByExperimentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    getExperimentByIdStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.notCalled(findAllByExperimentIdStub)
            })
        })

        it('returns rejected promise when findByExperimentId fails', () => {
            getExperimentByIdStub.resolves()
            findAllByExperimentIdStub.rejects(testError)

            return target.getTreatmentsByExperimentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    getExperimentByIdStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(
                    findAllByExperimentIdStub,
                    7,
                    sinon.match.same(tx))
            })
        })

        it('returns resolved promise from getByExperimentId method upon success', () => {
            getExperimentByIdStub.resolves()
            findAllByExperimentIdStub.resolves(testData)

            return target.getTreatmentsByExperimentId(7, tx).then((data) => {
                data.should.equal(testData)
                sinon.assert.calledWith(
                    getExperimentByIdStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(
                    findAllByExperimentIdStub,
                    7,
                    sinon.match.same(tx))
            })
        })
    })

    describe('getTreatmentById', () => {
        it('returns rejected promise when find fails', () => {
            findStub.rejects(testError)

            return target.getTreatmentById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    findStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            findStub.resolves(null)
            notFoundStub.returns(testError)

            return target.getTreatmentById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    findStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(notFoundStub, 'Treatment Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            findStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.getTreatmentById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    findStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(notFoundStub, 'Treatment Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            findStub.resolves(testData)

            return target.getTreatmentById(7, tx).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(
                    findStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('batchUpdateTreatments', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchUpdateTreatments(testTreatments, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testTreatments),
                    'PUT',
                    sinon.match.same(tx))
                sinon.assert.notCalled(batchUpdateStub)
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns rejected promise when batchUpdate fails', () => {
            validateStub.resolves()
            batchUpdateStub.rejects(testError)

            return target.batchUpdateTreatments(testTreatments, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testTreatments),
                    'PUT',
                    sinon.match.same(tx))
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(testTreatments),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchUpdateStub.resolves(testData)
            createPutResponseStub.returns(testPostResponse)

            return target.batchUpdateTreatments(testTreatments, testContext, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testTreatments),
                    'PUT',
                    sinon.match.same(tx))
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(testTreatments),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.calledWith(createPutResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('deleteTreatment', () => {
        it('returns rejected promise when remove fails', () => {
            removeStub.rejects(testError)

            return target.deleteTreatment(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    removeStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data is null', () => {
            removeStub.resolves(null)
            notFoundStub.returns(testError)

            return target.deleteTreatment(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    removeStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(notFoundStub, 'Treatment Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            removeStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.deleteTreatment(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    removeStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(notFoundStub, 'Treatment Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            removeStub.resolves(testData)

            return target.deleteTreatment(7, tx).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(
                    removeStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('deleteTreatmentsForExperimentId', () => {
        it('returns rejected promise when getExperimentById fails', () => {
            getExperimentByIdStub.rejects(testError)

            return target.deleteTreatmentsForExperimentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    getExperimentByIdStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.notCalled(removeByExperimentIdStub)
            })
        })

        it('returns rejected promise when removeByExperimentId fails', () => {
            getExperimentByIdStub.resolves()
            removeByExperimentIdStub.rejects(testError)

            return target.deleteTreatmentsForExperimentId(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    getExperimentByIdStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(
                    removeByExperimentIdStub,
                    7,
                    sinon.match.same(tx))
            })
        })

        it('returns resolved promise from removeByExperimentId method upon success', () => {
            getExperimentByIdStub.resolves()
            removeByExperimentIdStub.resolves(testData)

            return target.deleteTreatmentsForExperimentId(7, tx).then((data) => {
                data.should.equal(testData)
                sinon.assert.calledWith(
                    getExperimentByIdStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(
                    removeByExperimentIdStub,
                    7,
                    sinon.match.same(tx))
            })
        })
    })
})