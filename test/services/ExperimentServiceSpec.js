const sinon = require('sinon')
const chai = require('chai')
const ExperimentsService = require('../../src/services/ExperimentsService')
const db = require('../../src/db/DbManager')


const getStub =sinon.stub(db.experiments,'all')
const findStub =sinon.stub(db.experiments,'find')
const updateStub = sinon.stub(db.experiments, 'update')

after(() => {
    getStub.restore()
    findStub.restore()
    updateStub.restore()
})


describe('ExperimentsService', () => {

    describe('Get All Experiments:', () => {

        it('Success and Return 2 Experiments', (done)=> {
            getStub.resolves([
                {
                    "id": 30,
                    "name": "exp1001",
                    "subjectType": "plant",
                    "reps": 20,
                    "refExperimentDesignId": 2,
                    "createdDate": "2016-10-05T15:19:12.026Z",
                    "createdUserId": "akuma11",
                    "modifiedUserId": "akuma11",
                    "modifiedDate": "2016-10-05T15:19:12.026Z",
                    "status": "ACTIVE"
                },
                {
                    "id": 35,
                    "name": "exp1001",
                    "subjectType": "plant",
                    "reps": 20,
                    "refExperimentDesignId": 2,
                    "createdDate": "2016-10-05T15:49:45.700Z",
                    "createdUserId": "akuma11",
                    "modifiedUserId": "akuma11",
                    "modifiedDate": "2016-10-05T15:49:45.700Z",
                    "status": "ACTIVE"
                }
            ])
            const testObject = new ExperimentsService()
            testObject.getAllExperiments().then((experiments)=> {
                experiments.length.should.equal(2)
                experiments[0].id.should.equal(30)
            }).then(done,done)
        })

        it('fails', (done) => {
            getStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})

            const testObject = new ExperimentsService()
            testObject.getAllExperiments().should.be.rejected.and.notify(done)
        })


    })

    describe('Get Experiment By Id:', () => {

        it('Success and Return experiment with Id', (done)=> {
            findStub.resolves(
                {
                    "id": 30,
                    "name": "exp1001",
                    "subjectType": "plant",
                    "reps": 20,
                    "refExperimentDesignId": 2,
                    "createdDate": "2016-10-05T15:19:12.026Z",
                    "createdUserId": "akuma11",
                    "modifiedUserId": "akuma11",
                    "modifiedDate": "2016-10-05T15:19:12.026Z",
                    "status": "ACTIVE"
                },
              )
            const testObject = new ExperimentsService()
            testObject.getExperimentById(30).then((experiment)=> {
                experiment.id.should.equal(30)
                experiment.name.should.equal("exp1001")
            }).then(done,done)
        })

        it('fails', (done) => {
            findStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})
            const testObject = new ExperimentsService()
            testObject.getExperimentById(30).should.be.rejected.and.notify(done)
        })

        it('fails When it returns no result',(done)=>{
            findStub.resolves(null)
            const testObject = new ExperimentsService()
            testObject.getExperimentById(30).should.be.rejected
            testObject.getExperimentById(30).catch((err) => {
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Not Found for requested experimentId")
            }).then(done, done)

        })


    })


    describe('Update Experiment:', () => {

        it('Success and Return experiment', (done)=> {
            const experimentObj={
                "id": 30,
                "name": "exp1002",
                "subjectType": "plant",
                "reps": 20,
                "refExperimentDesignId": 2,
                "createdDate": "2016-10-05T15:19:12.026Z",
                "createdUserId": "akuma11",
                "modifiedUserId": "akuma11",
                "modifiedDate": "2016-10-05T15:19:12.026Z",
                "status": "ACTIVE"
            }
            updateStub.resolves(
                experimentObj
            )
            const testObject = new ExperimentsService()
            testObject.updateExperiment(30,experimentObj).then((experiment)=> {
                experiment.id.should.equal(30)
                experiment.name.should.equal("exp1002")
            }).then(done,done)
        })

        it('fails', (done) => {
            const experimentObj={
                "id": 30,
                "name": "exp1002",
                "subjectType": "plant",
                "reps": 20,
                "refExperimentDesignId": 2,
                "createdDate": "2016-10-05T15:19:12.026Z",
                "createdUserId": "akuma11",
                "modifiedUserId": "akuma11",
                "modifiedDate": "2016-10-05T15:19:12.026Z",
                "status": "ACTIVE"
            }
            updateStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})
            const testObject = new ExperimentsService()
            testObject.updateExperiment(30,experimentObj).should.be.rejected.and.notify(done)
        })

        it('fails When it returns no result',(done)=>{
            updateStub.resolves(null)
            const testObject = new ExperimentsService()
            testObject.updateExperiment(30).should.be.rejected
            testObject.updateExperiment(30).catch((err) => {
                err.validationMessages.length.should.equal(1)
                err.validationMessages[0].should.equal("Experiment Not Found to Update")
            }).then(done, done)

        })


    })

})