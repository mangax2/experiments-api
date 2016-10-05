const sinon = require('sinon')
const chai = require('chai')
const expect = chai.expect
const ExperimentDesignService = require('../../src/services/ExperimentDesignService')
const db = require('../../src/db/DbManager')

let stub = undefined

afterEach(() => {
    stub.restore()
})

describe.only('the ExperimentDesignService', () => {
    it('getAllExperimentDesign happy path', (done) => {
        stub = sinon.stub(db.experimentDesign, 'all')
        stub.resolves([{'id': 1, 'name': 'Split Plot'}, {'id': 2, 'name': 'Strip Plot'}])

        const testObject = new ExperimentDesignService()
        testObject.getAllExperimentDesigns().then((designs) => {
            designs.length.should.equal(2)
            designs[0]['id'].should.equal(1)
            designs[0]['name'].should.equal("Split Plot")
        }).then(done, done)
    })

    it('getAllExperimentDesign fails', (done) => {
        sinon.stub(db.experimentDesign, 'all').rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

        const testObject = new ExperimentDesignService()
        expect(testObject.getAllExperimentDesigns()).to.be.rejected.and.notify(done)
    })
})