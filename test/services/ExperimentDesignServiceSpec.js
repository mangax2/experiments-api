const sinon = require('sinon')
const ExperimentDesignService = require('../../src/services/ExperimentDesignService')
const ExperimentDesignsValidator = require('../../src/validations/ExperimentDesignsValidator')
const db = require('../../src/db/DbManager')

const testPayload = {}
const testResponse = {}
const testError = {}
const tx = {}

let createStub
let deleteStub
let experimentDesignService
let findStub
let getStub
let transactionStub
let updateStub
let validateStub

describe('ExperimentDesignService', () => {
    before(() => {
        createStub = sinon.stub(db.experimentDesign, 'create')
        deleteStub = sinon.stub(db.experimentDesign, 'delete')
        experimentDesignService = new ExperimentDesignService()
        findStub = sinon.stub(db.experimentDesign, 'find')
        getStub = sinon.stub(db.experimentDesign, 'all')
        transactionStub = sinon.stub(db.experimentDesign, 'repository', () => {
            return {tx: function(transactionName, callback){return callback(tx)}}
        })
        updateStub = sinon.stub(db.experimentDesign, 'update')
        validateStub = sinon.stub(experimentDesignService._validator, 'validate')


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

    describe('getAllExperimentDesign', () => {
        it('succeeds', () => {
            getStub.resolves(testResponse)

            return experimentDesignService.getAllExperimentDesigns().then((designs) => {
                sinon.assert.calledOnce(getStub)
                designs.should.equal(testResponse)
            })
        })

        it('fails', () => {
            getStub.rejects(testError)

            return experimentDesignService.getAllExperimentDesigns().should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(getStub)
                err.should.equal(testError)
            })
        })
    })

    describe('createExperiment Design', () => {
        it('succeeds and returns newly created experiment id: 1', () => {
            validateStub.resolves()
            createStub.resolves(1)

            return experimentDesignService.createExperimentDesign(testPayload, 'kmccl').then((result) => {
                result.should.equal(1)
                sinon.assert.calledWithExactly(
                    createStub,
                    sinon.match.same(tx),
                    sinon.match.same(testPayload),
                    'kmccl')
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects("Validation Failure")

            return experimentDesignService.createExperimentDesign(testPayload, 'kmccl').should.be.rejected.then((err) => {
                createStub.called.should.equal(false)
            })
        })

        it('fails', () => {
            validateStub.resolves()
            createStub.rejects(testError)

            return experimentDesignService.createExperimentDesign(testPayload, 'kmccl').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(
                    createStub,
                    sinon.match.same(tx),
                    sinon.match.same(testPayload),
                    'kmccl')
                err.should.equal(testError)
            })
        })
    })

    describe('getExperimentDesignById', () => {
        it('successfully gets experiment design with id 1', () => {
            findStub.resolves(testResponse)

            return experimentDesignService.getExperimentDesignById(1).then((result) => {
                sinon.assert.calledWithExactly(findStub, 1)
                result.should.equal(testResponse)
            })
        })

        it('fails', () => {
            findStub.rejects(testError)

            return experimentDesignService.getExperimentDesignById(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(findStub, 1)
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            findStub.resolves(null)

            return experimentDesignService.getExperimentDesignById(1).should.be.rejected.then((err) => {
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            })
        })
    })

    describe('updateExperimentDesign', () => {
        it('successfully updates experiment design with id 1', () => {
            updateStub.resolves(testResponse)
            validateStub.resolves()

            return experimentDesignService.updateExperimentDesign(1, testPayload, 'kmccl').then((design) => {
                sinon.assert.calledWithExactly(
                    updateStub,
                    1,
                    sinon.match.same(testPayload),
                    'kmccl')
                design.should.equal(testResponse)
            })
        })

        it('fails', () => {
            updateStub.rejects(testError)
            validateStub.resolves()

            return experimentDesignService.updateExperimentDesign(1, testPayload, 'kmccl').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(updateStub, 1, sinon.match.same(testPayload), 'kmccl')
                err.should.equal(testError)
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects("Failed Validation")

            return experimentDesignService.updateExperimentDesign(1, testPayload, 'kmccl').should.be.rejected.then((err) => {
                updateStub.called.should.equal(false)
            })
        })

        it('fails due to no data', () => {
            updateStub.resolves(null)
            validateStub.resolves()

            return experimentDesignService.updateExperimentDesign(1, testPayload, 'kmccl').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(updateStub, 1, sinon.match.same(testPayload), 'kmccl')
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            })
        })
    })

    describe('deleteExperimentDesign', () => {
        it('deletes an experiment and returns the deleted id', () => {
            deleteStub.resolves(1)

            return experimentDesignService.deleteExperimentDesign(1).then((value) =>{
                sinon.assert.calledWithExactly(deleteStub, 1)
                value.should.equal(1)
            })
        })

        it('fails', () => {
            deleteStub.rejects(testError)

            return experimentDesignService.deleteExperimentDesign(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(deleteStub, 1)
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            deleteStub.resolves(null)

            return experimentDesignService.deleteExperimentDesign(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(deleteStub, 1)
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            })
        })
    })
})