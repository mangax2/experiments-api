const sinon = require('sinon')
const chai = require('chai')
const expect = chai.expect
const ExperimentDesignService = require('../../src/services/ExperimentDesignService')
const db = require('../../src/db/DbManager')

let getStub = undefined
let createStub = undefined
let findStub = undefined
let updateStub = undefined
let transactionStub = undefined
let deleteStub = undefined

afterEach(() => {
    if(getStub){ getStub.restore()}
    if(createStub) { createStub.restore()}
    if(findStub){ findStub.restore()}
    if(updateStub){ updateStub.restore()}
    if(transactionStub){ transactionStub.restore()}
    if(deleteStub){ deleteStub.restore()}
})

describe('the ExperimentDesignService', () => {
    it('getAllExperimentDesign happy path', (done) => {
        getStub = sinon.stub(db.experimentDesign, 'all')
        getStub.resolves([{'id': 1, 'name': 'Split Plot'}, {'id': 2, 'name': 'Strip Plot'}])

        const testObject = new ExperimentDesignService()
        testObject.getAllExperimentDesigns().then((designs) => {
            designs.length.should.equal(2)
            designs[0]['id'].should.equal(1)
            designs[0]['name'].should.equal("Split Plot")
        }).then(done, done)
    })

    it('getAllExperimentDesign fails', (done) => {
        getStub = sinon.stub(db.experimentDesign, 'all')
        getStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

        const testObject = new ExperimentDesignService()
        expect(testObject.getAllExperimentDesigns()).to.be.rejected.and.notify(done)
    })

    it('createExperimentDesign', (done) => {
        createStub = sinon.stub(db.experimentDesign, 'create')
        createStub.resolves(1)
        transactionStub = sinon.stub(db.experimentDesign, 'repository', () => {
            return {tx: function(transactionName, callback){return callback()}}
        })

        const testObject = new ExperimentDesignService()
        testObject.createExperimentDesign({'name': 'Split Split Plot'}).then((result) => {
            result.should.equal(1)
        }).then(done, done)
    })

    it('createExperimentDesign fails', (done) => {
        createStub = sinon.stub(db.experimentDesign, 'create')
        createStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

        const testObject = new ExperimentDesignService()
        expect(testObject.createExperimentDesign({'name': 'Split Plot'})).to.be.rejected.and.notify(done)
    })

    it('getExperimentDesignById', (done) => {
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.resolves({'id': 1, 'name': 'Split Plot'})

        const testObject = new ExperimentDesignService()
        testObject.getExperimentDesignById(1).then((result) => {
            result.id.should.equal(1)
            result.name.should.equal('Split Plot')
        }).then(done, done)
    })

    it('getExperimentDesignById fails', (done) => {
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

        const testObject = new ExperimentDesignService()
        expect(testObject.getExperimentDesignById(1)).to.be.rejected.and.notify(done)
    })

    it('getExperimentDesignById fails with no data', (done) => {
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.resolves(null)

        const testObject = new ExperimentDesignService()
        expect(testObject.getExperimentDesignById(1)).to.be.rejected
        testObject.getExperimentDesignById(1).catch((err) => {
            err.validationMessages.length.should.equal(1)
            err.validationMessages[0].should.equal("Experiment Design Not Found")
        }).then(done, done)
    })

    it('updateExperimentDesign', (done) => {
        updateStub = sinon.stub(db.experimentDesign, 'update')
        updateStub.resolves({'id': 1, 'name': 'Group Block'})
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.resolves({'id': 1, 'name': 'Split Plot'})
        transactionStub = sinon.stub(db.experimentDesign, 'repository', () => {
            return {tx: function(transactionName, callback){return callback()}}
        })

        const testObject = new ExperimentDesignService()
        testObject.updateExperimentDesign(1, {'name': 'Group Block'}).then((design) => {
            design.name.should.equal('Group Block')
            design.id.should.equal(1)
        }).then(done, done)
    })

    it('updateExperimentDesign fails', (done) => {
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.resolves({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

        updateStub = sinon.stub(db.experimentDesign, 'update')
        updateStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

        const testObject = new ExperimentDesignService()
        expect(testObject.updateExperimentDesign(1, {'name': 'Group Block'})).to.be.rejected.and.notify(done)
    })

    it('updateExperimentDesign fails due to no experiment', (done) => {
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.resolves(null)

        const testObject = new ExperimentDesignService()
        expect(testObject.getExperimentDesignById(1)).to.be.rejected
        testObject.getExperimentDesignById(1).catch((err) => {
            err.validationMessages.length.should.equal(1)
            err.validationMessages[0].should.equal("Experiment Design Not Found")
        }).then(done, done)
    })

    it('deleteExperimentDesign', (done) => {
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.resolves({'id': 1, 'name': 'Split Plot'})
        deleteStub = sinon.stub(db.experimentDesign, 'delete')
        deleteStub.resolves(1)
        transactionStub = sinon.stub(db.experimentDesign, 'repository', () => {
            return {tx: function(transactionName, callback){return callback()}}
        })

        const testObject = new ExperimentDesignService()
        testObject.deleteExperimentDesign(1).then((value) =>{
            value.should.equal(1)
        }).then(done, done)
    })

    it('deleteExperimentDesign fails', (done) => {
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.resolves({'id': 1, 'name': 'Split Plot'})
        deleteStub = sinon.stub(db.experimentDesign, 'delete')
        deleteStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})
        transactionStub = sinon.stub(db.experimentDesign, 'repository', () => {
            return {tx: function(transactionName, callback){return callback()}}
        })

        const testObject = new ExperimentDesignService()
        expect(testObject.deleteExperimentDesign(1)).to.be.rejected.and.notify(done)
    })

    it('deleteExperimentDesign fails', (done) => {
        findStub = sinon.stub(db.experimentDesign, 'find')
        findStub.resolves(null)

        const testObject = new ExperimentDesignService()
        expect(testObject.deleteExperimentDesign(1)).to.be.rejected
        testObject.deleteExperimentDesign(1).catch((err) => {
            err.validationMessages.length.should.equal(1)
            err.validationMessages[0].should.equal("Experiment Design Not Found")
        }).then(done, done)
    })
})