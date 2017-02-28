import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
const sinon = require('sinon')
const UnitSpecificationDetailService = require('../../src/services/UnitSpecificationDetailService')
const db = require('../../src/db/DbManager')

describe('UnitSpecificationDetailService', () => {

    let target

    const testDetails = []
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
    let batchFindStub
    let findAllByExperimentIdStub
    let batchCreateStub
    let batchUpdateStub
    let removeStub
    let batchRemoveStub
    let removeByExperimentIdStub

    before(() => {
        target = new UnitSpecificationDetailService()

        getExperimentByIdStub = sinon.stub(target._experimentService, 'getExperimentById')
        createPostResponseStub = sinon.stub(AppUtil, 'createPostResponse')
        createPutResponseStub = sinon.stub(AppUtil, 'createPutResponse')
        notFoundStub = sinon.stub(AppError, 'notFound')
        validateStub = sinon.stub(target._validator, 'validate')
        findStub = sinon.stub(db.unitSpecificationDetail, 'find')
        batchFindStub = sinon.stub(db.unitSpecificationDetail, 'batchFind')
        findAllByExperimentIdStub = sinon.stub(db.unitSpecificationDetail, 'findAllByExperimentId')
        batchCreateStub = sinon.stub(db.unitSpecificationDetail, 'batchCreate')
        batchUpdateStub = sinon.stub(db.unitSpecificationDetail, 'batchUpdate')
        removeStub = sinon.stub(db.unitSpecificationDetail, 'remove')
        batchRemoveStub = sinon.stub(db.unitSpecificationDetail, 'batchRemove')
        removeByExperimentIdStub = sinon.stub(db.unitSpecificationDetail, 'removeByExperimentId')
    })

    afterEach(() => {
        getExperimentByIdStub.reset()
        createPostResponseStub.reset()
        createPutResponseStub.reset()
        notFoundStub.reset()
        validateStub.reset()
        findStub.reset()
        batchFindStub.reset()
        findAllByExperimentIdStub.reset()
        batchCreateStub.reset()
        batchUpdateStub.reset()
        removeStub.reset()
        batchRemoveStub.reset()
        removeByExperimentIdStub.reset()
    })

    after(() => {
        getExperimentByIdStub.restore()
        createPostResponseStub.restore()
        createPutResponseStub.restore()
        notFoundStub.restore()
        validateStub.restore()
        findStub.restore()
        batchFindStub.restore()
        findAllByExperimentIdStub.restore()
        batchCreateStub.restore()
        batchUpdateStub.restore()
        removeStub.restore()
        batchRemoveStub.restore()
        removeByExperimentIdStub.restore()
    })

    describe('batchCreateUnitSpecificationDetails', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchCreateUnitSpecificationDetails(testDetails, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testDetails),
                    'POST')
                sinon.assert.notCalled(batchCreateStub)
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns rejected promise when batchCreate fails', () => {
            validateStub.resolves()
            batchCreateStub.rejects(testError)

            return target.batchCreateUnitSpecificationDetails(testDetails, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testDetails),
                    'POST',
                    sinon.match.same(tx))
                sinon.assert.calledWith(batchCreateStub,
                    sinon.match.same(testDetails),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.notCalled(createPostResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchCreateStub.resolves(testData)
            createPostResponseStub.returns(testPostResponse)

            return target.batchCreateUnitSpecificationDetails(testDetails, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testDetails),
                    'POST')
                sinon.assert.calledWith(batchCreateStub,
                    sinon.match.same(testDetails),
                    sinon.match.same(tx))
                sinon.assert.calledWith(createPostResponseStub,
                    sinon.match.same(testData))
            })
        })
    })

    describe('getUnitSpecificationDetailsByExperimentId', () => {
        it('returns rejected promise when getExperimentById fails', () => {
            getExperimentByIdStub.rejects(testError)

            return target.getUnitSpecificationDetailsByExperimentId(7, tx).should.be.rejected.then((err) => {
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

            return target.getUnitSpecificationDetailsByExperimentId(7, tx).should.be.rejected.then((err) => {
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

            return target.getUnitSpecificationDetailsByExperimentId(7, tx).then((data) => {
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

    describe('getUnitSpecificationDetailById', () => {
        it('returns rejected promise when find fails', () => {
            findStub.rejects(testError)

            return target.getUnitSpecificationDetailById(7, tx).should.be.rejected.then((err) => {
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

            return target.getUnitSpecificationDetailById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    findStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(notFoundStub, 'Unit Specification Detail Not Found for requested id')
            })
        })

        it('returns rejected promise when data is undefined', () => {
            findStub.resolves(undefined)
            notFoundStub.returns(testError)

            return target.getUnitSpecificationDetailById(7, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    findStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.calledWith(notFoundStub, 'Unit Specification Detail Not Found for requested id')
            })
        })

        it('returns resolved promise with data on success', () => {
            findStub.resolves(testData)

            return target.getUnitSpecificationDetailById(7, tx).then((r) => {
                r.should.equal(testData)
                sinon.assert.calledWith(
                    findStub,
                    7,
                    sinon.match.same(tx))
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('batchGetUnitSpecificationDetailsByIds', () => {
        it('returns rejected promise when batchFind fails', () => {
            batchFindStub.rejects(testError)

            return target.batchGetUnitSpecificationDetailsByIds([7], tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    batchFindStub,
                    [7],
                    sinon.match.same(tx))
                sinon.assert.notCalled(notFoundStub)
            })
        })

        it('returns rejected promise when data count does not match id count', () => {
            batchFindStub.resolves({}, null, {})
            notFoundStub.returns(testError)

            return target.batchGetUnitSpecificationDetailsByIds([1,2,3], tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(
                    batchFindStub,
                    [1,2,3],
                    sinon.match.same(tx))
                sinon.assert.calledWith(notFoundStub, 'Unit Specification Detail not found for all requested ids.')
            })
        })

        it('returns resolved promise when data found for all ids', () => {
            const findResult = [{}, {}, {}]
            batchFindStub.resolves(findResult)

            return target.batchGetUnitSpecificationDetailsByIds([1,2,3], tx).then((r) => {
                r.should.equal(findResult)
                sinon.assert.calledWith(
                    batchFindStub,
                    [1,2,3],
                    sinon.match.same(tx))
                sinon.assert.notCalled(notFoundStub)
            })
        })
    })

    describe('batchUpdateUnitSpecificationDetails', () => {
        it('returns rejected promise when validate fails', () => {
            validateStub.rejects(testError)

            return target.batchUpdateUnitSpecificationDetails(testDetails, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testDetails),
                    'PUT',
                    sinon.match.same(tx))
                sinon.assert.notCalled(batchUpdateStub)
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns rejected promise when batchUpdate fails', () => {
            validateStub.resolves()
            batchUpdateStub.rejects(testError)

            return target.batchUpdateUnitSpecificationDetails(testDetails, testContext, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testDetails),
                    'PUT',
                    sinon.match.same(tx))
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(testDetails),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.notCalled(createPutResponseStub)
            })
        })

        it('returns resolved promise with data when all calls are success', () => {
            validateStub.resolves()
            batchUpdateStub.resolves(testData)
            createPutResponseStub.returns(testPostResponse)

            return target.batchUpdateUnitSpecificationDetails(testDetails, testContext, tx).then((r) => {
                r.should.equal(testPostResponse)
                sinon.assert.calledWith(validateStub,
                    sinon.match.same(testDetails),
                    'PUT',
                    sinon.match.same(tx))
                sinon.assert.calledWith(batchUpdateStub,
                    sinon.match.same(testDetails),
                    sinon.match.same(testContext),
                    sinon.match.same(tx))
                sinon.assert.calledWith(createPutResponseStub,
                    sinon.match.same(testData))
            })
        })
    })
})