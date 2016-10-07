const sinon = require('sinon')
const ExperimentDesignService = require('../../src/services/ExperimentDesignService')
const db = require('../../src/db/DbManager')

const testPayload = {}
const testResponse = {}
const testError = {}
const tx = {}

let getStub
let createStub
let findStub
let updateStub
let deleteStub
let transactionStub




describe('ExperimentDesignService', () => {
    before(() => {
        getStub = sinon.stub(db.experimentDesign, 'all')
        createStub = sinon.stub(db.experimentDesign, 'create')
        findStub = sinon.stub(db.experimentDesign, 'find')
        updateStub = sinon.stub(db.experimentDesign, 'update')
        deleteStub = sinon.stub(db.experimentDesign, 'delete')
        transactionStub = sinon.stub(db.experimentDesign, 'repository', () => {
            return {tx: function(transactionName, callback){return callback(tx)}}
        })

    })

    after(() => {
        getStub.restore()
        createStub.restore()
        findStub.restore()
        updateStub.restore()
        deleteStub.restore()
        transactionStub.restore()

    })
    describe('getAllExperimentDesign', () => {
        it('succeeds and returns 2 experiment designs', () => {
            getStub.resolves(testResponse)

            const testObject = new ExperimentDesignService()

            return testObject.getAllExperimentDesigns().then((designs) => {
                sinon.assert.calledOnce(getStub)
                designs.should.equal(testResponse)
            })
        })

        it('fails', () => {
            getStub.rejects(testError)

            const testObject = new ExperimentDesignService()
            return testObject.getAllExperimentDesigns().should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(getStub)
                err.should.equal(testError)
            })
        })

    })

    describe('createExperiment Design', () => {
        it('succeeds and returns newly created experiment id: 1', () => {
            createStub.resolves(1)

            const testObject = new ExperimentDesignService()
            return testObject.createExperimentDesign(testPayload, 'kmccl').then((result) => {
                result.should.equal(1)
                sinon.assert.calledWithExactly(
                    createStub,
                    sinon.match.same(tx),
                    sinon.match.same(testPayload),
                    'kmccl')
            })
        })

        it('fails', () => {
            createStub.rejects(testError)

            const testObject = new ExperimentDesignService()
            return testObject.createExperimentDesign(testPayload, 'kmccl').should.be.rejected.then((err) => {
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

            const testObject = new ExperimentDesignService()
            return testObject.getExperimentDesignById(1).then((result) => {
                sinon.assert.calledWithExactly(findStub, 1)
                result.should.equal(testResponse)
            })
        })

        it('fails', () => {
            findStub.rejects(testError)

            const testObject = new ExperimentDesignService()
            return testObject.getExperimentDesignById(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(findStub, 1)
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            findStub.resolves(null)

            const testObject = new ExperimentDesignService()
            return testObject.getExperimentDesignById(1).should.be.rejected.then((err) => {
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            })
        })
    })

    describe('updateExperimentDesign', () => {
        it('successfully updates experiment design with id 1', () => {
            updateStub.resolves(testResponse)

            const testObject = new ExperimentDesignService()
            return testObject.updateExperimentDesign(1, testPayload, 'kmccl').then((design) => {
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

            const testObject = new ExperimentDesignService()
            return testObject.updateExperimentDesign(1, testPayload, 'kmccl').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(updateStub, 1, sinon.match.same(testPayload), 'kmccl')
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            updateStub.resolves(null)

            const testObject = new ExperimentDesignService()
            return testObject.updateExperimentDesign(1, testPayload, 'kmccl').should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(updateStub, 1, sinon.match.same(testPayload), 'kmccl')
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            })
        })
    })

    describe('deleteExperimentDesign', () => {
        it('deletes an experiment and returns the deleted id', () => {
            deleteStub.resolves(1)

            const testObject = new ExperimentDesignService()
            return testObject.deleteExperimentDesign(1).then((value) =>{
                sinon.assert.calledWithExactly(deleteStub, 1)
                value.should.equal(1)
            })
        })

        it('fails', () => {
            deleteStub.rejects(testError)

            const testObject = new ExperimentDesignService()
            return testObject.deleteExperimentDesign(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(deleteStub, 1)
                err.should.equal(testError)
            })
        })

        it('fails due to no data', () => {
            deleteStub.resolves(null)

            const testObject = new ExperimentDesignService()
            testObject.deleteExperimentDesign(1).should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(deleteStub, 1)
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            })
        })
    })
})