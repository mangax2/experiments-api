const sinon = require('sinon')
const chai = require('chai')
const ExperimentsService = require('../../src/services/ExperimentsService')
const db = require('../../src/db/DbManager')

const tx = {}
const getStub = sinon.stub(db.experiments, 'all')
const findStub = sinon.stub(db.experiments, 'find')
const updateStub = sinon.stub(db.experiments, 'update')
const createStub = sinon.stub(db.experiments, 'create')
const removeStub = sinon.stub(db.experiments, 'remove')
const transactionStub = sinon.stub(db.experiments, 'repository', () => {
    return {
        tx: function (transactionName, callback) {
            return callback(tx)
        }
    }
})

after(() => {
    getStub.restore()
    findStub.restore()
    updateStub.restore()
    createStub.restore()
    removeStub.restore()
})


describe('ExperimentsService', () => {

    describe('Get All Experiments:', () => {

        it('Success and Return 2 Experiments', (done)=> {
            getStub.resolves([
                {
                    'id': 30,
                    'name': 'exp1001',
                    'subjectType': 'plant',
                    'reps': 20,
                    'refExperimentDesignId': 2,
                    'createdDate': '2016-10-05T15:19:12.026Z',
                    'createdUserId': 'akuma11',
                    'modifiedUserId': 'akuma11',
                    'modifiedDate': '2016-10-05T15:19:12.026Z',
                    'status': 'ACTIVE'
                },
                {
                    'id': 35,
                    'name': 'exp1001',
                    'subjectType': 'plant',
                    'reps': 20,
                    'refExperimentDesignId': 2,
                    'createdDate': '2016-10-05T15:49:45.700Z',
                    'createdUserId': 'akuma11',
                    'modifiedUserId': 'akuma11',
                    'modifiedDate': '2016-10-05T15:49:45.700Z',
                    'status': 'ACTIVE'
                }
            ])
            const testObject = new ExperimentsService()
            testObject.getAllExperiments().then((experiments)=> {
                experiments.length.should.equal(2)
                experiments[0].id.should.equal(30)
            }).then(done, done)
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
                    'id': 30,
                    'name': 'exp1001',
                    'subjectType': 'plant',
                    'reps': 20,
                    'refExperimentDesignId': 2,
                    'createdDate': '2016-10-05T15:19:12.026Z',
                    'createdUserId': 'akuma11',
                    'modifiedUserId': 'akuma11',
                    'modifiedDate': '2016-10-05T15:19:12.026Z',
                    'status': 'ACTIVE'
                },
            )
            const testObject = new ExperimentsService()
            testObject.getExperimentById(30).then((experiment)=> {
                experiment.id.should.equal(30)
                experiment.name.should.equal('exp1001')
            }).then(done, done)
        })

        it('fails', (done) => {
            findStub.rejects({'status': 500, 'code': 'Internal Server Error', 'errorMessage': 'Please Contact Support'})
            const testObject = new ExperimentsService()
            testObject.getExperimentById(30).should.be.rejected.and.notify(done)
        })

        it('fails When it returns no result', (done)=> {
            findStub.resolves(null)
            const testObject = new ExperimentsService()
            testObject.getExperimentById(30).should.be.rejected
            testObject.getExperimentById(30).catch((err) => {
                err.output.statusCode.should.equal(404)
                err.message.should.equal('Experiment Not Found for requested experimentId')
            }).then(done, done)

        })

    })


    describe('create Experiments', () => {

        const experimentsObj = [{
            'name': 'exp1002',
            'subjectType': 'plant',
            'reps': 20,
            'refExperimentDesignId': 2,
            'createdDate': '2016-10-05T15:19:12.026Z',
            'createdUserId': 'akuma11',
            'modifiedUserId': 'akuma11',
            'modifiedDate': '2016-10-05T15:19:12.026Z',
            'status': 'ACTIVE'
        }]

        const expectedResult = [
            {
                'status': 201,
                'message': 'Resource created',
                'id': 1
            }
        ]

        it('succeeds and returns newly created experiment id with status and message for one experiment create request', (done) => {

            createStub.resolves({id: 1})
            const testObject = new ExperimentsService()
            testObject.createExperiment(experimentsObj).then((result) => {
                result.should.eql(expectedResult)
            }).then(done, done)
        })

        it('succeeds and returns list of experiment ids with status and message for batch experiment create request', (done) => {
            experimentsObj.push(
                {
                    'name': 'exp1003',
                    'subjectType': 'plant',
                    'reps': 20,
                    'refExperimentDesignId': 2,
                    'createdDate': '2016-10-05T15:19:12.026Z',
                    'createdUserId': 'akuma11',
                    'modifiedUserId': 'akuma11',
                    'modifiedDate': '2016-10-05T15:19:12.026Z',
                    'status': 'ACTIVE'
                }
            )
            expectedResult.push(
                {
                    'status': 201,
                    'message': 'Resource created',
                    'id': 1
                }
            )

            createStub.resolves({id: 1})
            const testObject = new ExperimentsService()
            testObject.createExperiment(experimentsObj).then((result) => {
                result.should.eql(expectedResult)
            }).then(done, done)
        })

        it('fails', (done) => {
            createStub.rejects({
                'status': 500,
                'code': 'Internal Server Error',
                'errorMessage': 'Please Contact Support'
            })

            const testObject = new ExperimentsService()
            testObject.createExperiment(experimentsObj).should.be.rejected.and.notify(done)
        })
    })


    describe('Update Experiment:', () => {

        it('Success and Return experiment', (done)=> {
            const experimentResObj = {
                'id': 30,
                'name': 'exp1002',
                'subjectType': 'plant',
                'reps': 20,
                'refExperimentDesignId': 2,
                'createdDate': '2016-10-05T15:19:12.026Z',
                'createdUserId': 'akuma11',
                'modifiedUserId': 'akuma11',
                'modifiedDate': '2016-10-05T15:19:12.026Z',
                'status': 'ACTIVE'
            }
            const experimentReqObj = {
                'name': 'exp1002',
                'subjectType': 'plant',
                'reps': 20,
                'refExperimentDesignId': 2,
                'createdDate': '2016-10-05T15:19:12.026Z',
                'createdUserId': 'akuma11',
                'modifiedUserId': 'akuma11',
                'modifiedDate': '2016-10-05T15:19:12.026Z',
                'status': 'ACTIVE'
            }
            updateStub.resolves(
                experimentResObj
            )
            const testObject = new ExperimentsService()
            testObject.updateExperiment(30, experimentReqObj).then((experiment)=> {
                experiment.id.should.equal(30)
                experiment.name.should.equal('exp1002')
            }).then(done, done)
        })

        it('fails', (done) => {
            const experimentReqObj = {
                'name': 'exp1002',
                'subjectType': 'plant',
                'reps': 20,
                'refExperimentDesignId': 2,
                'createdDate': '2016-10-05T15:19:12.026Z',
                'createdUserId': 'akuma11',
                'modifiedUserId': 'akuma11',
                'modifiedDate': '2016-10-05T15:19:12.026Z',
                'status': 'ACTIVE'
            }
            updateStub.rejects({
                'status': 500,
                'code': 'Internal Server Error',
                'errorMessage': 'Please Contact Support'
            })
            const testObject = new ExperimentsService()
            testObject.updateExperiment(30, experimentReqObj).should.be.rejected.and.notify(done)
        })

        it('fails When it returns no result', (done)=> {
            updateStub.resolves(null)
            const experimentReqObj = {
                'name': 'exp1002',
                'subjectType': 'plant',
                'reps': 20,
                'refExperimentDesignId': 2,
                'createdDate': '2016-10-05T15:19:12.026Z',
                'createdUserId': 'akuma11',
                'modifiedUserId': 'akuma11',
                'modifiedDate': '2016-10-05T15:19:12.026Z',
                'status': 'ACTIVE'
            }
            const testObject = new ExperimentsService()
            testObject.updateExperiment(30, experimentReqObj).should.be.rejected
            testObject.updateExperiment(30, experimentReqObj).catch((err) => {
                err.output.statusCode.should.equal(404)
                err.message.should.equal('Experiment Not Found to Update')
            }).then(done, done)

        })


    })

    describe('Delete Experiment:', () => {

        it('Success and Return experimentId', (done)=> {
            const id = 30
            removeStub.resolves(id)
            const testObject = new ExperimentsService()
            testObject.deleteExperiment(30).then((id)=> {
                id.should.equal(30)
            }).then(done, done)
        })

        it('fails', (done) => {
            removeStub.rejects({
                'status': 500,
                'code': 'Internal Server Error',
                'errorMessage': 'Please Contact Support'
            })
            const testObject = new ExperimentsService()
            testObject.deleteExperiment(30).should.be.rejected.and.notify(done)
        })

        it('fails When it returns no result', (done)=> {
            removeStub.resolves(null)
            const testObject = new ExperimentsService()
            testObject.deleteExperiment(30).should.be.rejected
            testObject.deleteExperiment(30).catch((err) => {
                err.output.statusCode.should.equal(404)
                err.message.should.equal('Experiment Not Found for requested experimentId')
            }).then(done, done)

        })


    })

})