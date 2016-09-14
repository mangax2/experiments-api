const sinon = require('sinon')
const ExperimentsService = require('../../src/services/ExperimentsService')
const db = require('../../src/db/DbManager')

describe('the ExperimentsService', () => {
    it('getAllExperiments happy path', (done) => {
        sinon.stub(db.experiments, 'all').resolves([{'id': 2}])

        const testObject = new ExperimentsService()
        testObject.getAllExperiments().then((experiments) => {
            experiments.length.should.equal(1)
            experiments[0]['id'].should.equal(2)
        }).then(done, done)
    })
})