const sinon = require('sinon')
const chai = require('chai')
const ExperimentDesignService = require('../../src/services/ExperimentDesignService')
const db = require('../../src/db/DbManager')

const createStub = sinon.stub(db.experimentDesign, 'create')
const deleteStub = sinon.stub(db.experimentDesign, 'delete')
const findStub = sinon.stub(db.experimentDesign, 'find')
const getStub = sinon.stub(db.experimentDesign, 'all')
const transactionStub = sinon.stub(db.experimentDesign, 'repository', () => {
    return {tx: function(transactionName, callback){return callback()}}
})
const updateStub = sinon.stub(db.experimentDesign, 'update')

after(() => {
    createStub.restore()
    deleteStub.restore()
    findStub.restore()
    getStub.restore()
    transactionStub.restore()
    updateStub.restore()
})

describe('ExperimentDesignService', () => {
    describe('getAllExperimentDesign', () => {
        it('succeeds and returns 2 experiment designs', (done) => {
            getStub.resolves([{'id': 1, 'name': 'Split Plot'}, {'id': 2, 'name': 'Strip Plot'}])

            const testObject = new ExperimentDesignService()
            testObject.getAllExperimentDesigns().then((designs) => {
                designs.length.should.equal(2)
                designs[0]['id'].should.equal(1)
                designs[0]['name'].should.equal("Split Plot")
            }).then(done, done)
        })

        it('fails', (done) => {
            getStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

            const testObject = new ExperimentDesignService()
            testObject.getAllExperimentDesigns().should.be.rejected.and.notify(done)
        })

    })

    describe('createExperiment Design', () => {
        it('succeeds and returns newly created experiment id: 1', (done) => {
            createStub.resolves(1)

            const testObject = new ExperimentDesignService()
            testObject.createExperimentDesign({'name': 'Split Split Plot'}).then((result) => {
                result.should.equal(1)
            }).then(done, done)
        })

        it('fails', (done) => {
            createStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

            const testObject = new ExperimentDesignService()
            testObject.createExperimentDesign({'name': 'Split Plot'}).should.be.rejected.and.notify(done)
        })
    })

    describe('getExperimentDesignById', () => {
        it('successfully gets experiment design with id 1', (done) => {
            findStub.resolves({'id': 1, 'name': 'Split Plot'})

            const testObject = new ExperimentDesignService()
            testObject.getExperimentDesignById(1).then((result) => {
                result.id.should.equal(1)
                result.name.should.equal('Split Plot')
            }).then(done, done)
        })

        it('fails', (done) => {
            findStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

            const testObject = new ExperimentDesignService()
            testObject.getExperimentDesignById(1).should.be.rejected.and.notify(done)
        })

        it('fails due to no data', (done) => {
            findStub.resolves(null)

            const testObject = new ExperimentDesignService()
            testObject.getExperimentDesignById(1).should.be.rejected
            testObject.getExperimentDesignById(1).catch((err) => {
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            }).then(done, done)
        })
    })

    describe('updateExperimentDesign', () => {
        it('successfully updates experiment design with id 1', (done) => {
            updateStub.resolves({'id': 1, 'name': 'Group Block'})

            const testObject = new ExperimentDesignService()
            testObject.updateExperimentDesign(1, {'name': 'Group Block'}).then((design) => {
                design.name.should.equal('Group Block')
                design.id.should.equal(1)
            }).then(done, done)
        })

        it('fails', (done) => {
            updateStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

            const testObject = new ExperimentDesignService()
            testObject.updateExperimentDesign(1, {'name': 'Group Block'}).should.be.rejected.and.notify(done)
        })

        it('fails due to no data', (done) => {
            updateStub.resolves(null)

            const testObject = new ExperimentDesignService()
            testObject.updateExperimentDesign(1, {'name': 'Strip Plot'}).should.be.rejected
            testObject.updateExperimentDesign(1, {'name': 'Strip Plot'}).catch((err) => {
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            }).then(done, done)
        })
    })

    describe('deleteExperimentDesign', () => {
        it('deletes an experiment and returns the deleted id', (done) => {
            findStub.resolves({'id': 1, 'name': 'Split Plot'})
            deleteStub.resolves(1)

            const testObject = new ExperimentDesignService()
            testObject.deleteExperimentDesign(1).then((value) =>{
                value.should.equal(1)
            }).then(done, done)
        })

        it('fails', (done) => {
            deleteStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

            const testObject = new ExperimentDesignService()
            testObject.deleteExperimentDesign(1).should.be.rejected.and.notify(done)
        })

        it('fails due to no data', (done) => {
            deleteStub.resolves(null)

            const testObject = new ExperimentDesignService()
            testObject.deleteExperimentDesign(1).should.be.rejected
            testObject.deleteExperimentDesign(1).catch((err) => {
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Design Not Found")
            }).then(done, done)
        })
    })
})