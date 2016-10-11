const sinon = require('sinon')
const chai = require('chai')
const ExperimentsService = require('../../src/services/ExperimentsService')
const db = require('../../src/db/DbManager')

const testPayload = {}
const testResponse = {}
const testError = {}
const tx = {}

let createStub
let expDesignFindStub
let experimentsService
let findStub
let getStub
let removeStub
let transactionStub
let updateStub
let validateStub

describe('ExperimentsService', () => {
    before(() => {
        createStub = sinon.stub(db.experiments, 'create')
        expDesignFindStub = sinon.stub(db.experimentDesign, 'find')
        experimentsService = new ExperimentsService()
        findStub = sinon.stub(db.experiments, 'find')
        getStub = sinon.stub(db.experiments, 'all')
        removeStub = sinon.stub(db.experiments, 'remove')
        transactionStub = sinon.stub(db.experiments, 'repository', () => {
            return { tx: function (transactionName, callback) {return callback(tx)} }
        })
        updateStub = sinon.stub(db.experiments, 'update')
        validateStub = sinon.stub(experimentsService._validator, 'validate')
    })

    after(() => {
        createStub.restore()
        expDesignFindStub.restore()
        findStub.restore()
        getStub.restore()
        removeStub.restore()
        transactionStub.restore()
        updateStub.restore()
        validateStub.restore()

    })

    afterEach(() => {
        createStub.reset()
        expDesignFindStub.reset()
        findStub.reset()
        getStub.reset()
        removeStub.reset()
        transactionStub.reset()
        updateStub.reset()
        validateStub.reset()
    })

    describe('Get All Experiments:', () => {
        it('Success', ()=> {
            getStub.resolves(testResponse)

            return experimentsService.getAllExperiments().then((experiments)=> {
                sinon.assert.calledOnce(getStub)
                experiments.should.equal(testResponse)
            })
        })

        it('fails', () => {
            getStub.rejects(testError)

            return experimentsService.getAllExperiments().should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(getStub)
                err.should.equal(testError)
            })
        })
    })

    describe('Get Experiment By Id:', () => {
        it('Success and Return experiment with Id', ()=> {
            findStub.resolves(testResponse)

            return experimentsService.getExperimentById(30).then((experiment)=> {
                sinon.assert.calledWithExactly(findStub, 30)
                experiment.should.equal(testResponse)
            })
        })

        it('fails', () => {
            findStub.rejects(testError)

            return experimentsService.getExperimentById(30).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(findStub, 30)
            })
        })

        it('fails When it returns no result', ()=> {
            findStub.resolves(null)

            return experimentsService.getExperimentById(30).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Experiment Not Found for requested experimentId')
                sinon.assert.calledWithExactly(findStub, 30)
            })
        })
    })

    describe('create Experiments', () => {

        const experimentsObj = [{
            'name': 'exp1002',
            'subjectType': 'plant',
            'reps': 20,
            'refExperimentDesignId': 2,
            'createdDate': '2016-10-05T15:19:12.026Z',
            'userId': 'akuma11',
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

        it('succeeds and returns newly created experiment id with status and message for one experiment create request', () => {
            createStub.resolves({id: 1})
            expDesignFindStub.resolves({id: 2})
            validateStub.resolves()

            return experimentsService.createExperiment(experimentsObj).then((result) => {
                result.should.eql(expectedResult)
                createStub.calledOnce.should.equal(true)
                sinon.assert.calledWithExactly(
                    createStub,
                    sinon.match.same(tx),
                    sinon.match.same(experimentsObj[0]))
            })
        })

        it('succeeds and returns list of experiment ids with status and message for batch experiment create request', () => {
            experimentsObj.push(
                {
                    'name': 'exp1003',
                    'subjectType': 'plant',
                    'reps': 20,
                    'refExperimentDesignId': 2,
                    'createdDate': '2016-10-05T15:19:12.026Z',
                    'userId': 'akuma11',
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
            expDesignFindStub.resolves({id: 2})
            validateStub.resolves()

            return experimentsService.createExperiment(experimentsObj).then((result) => {
                result.should.eql(expectedResult)
                createStub.calledTwice.should.equal(true)
            })
        })

        it('fails', () => {
            createStub.rejects(testError)
            validateStub.resolves()

            return experimentsService.createExperiment(experimentsObj).should.be.rejected.then((err) => {
                err.should.equal(testError)
            })
        })

        it('fails due to not finding experiment design', () => {
            expDesignFindStub.resolves(null)

            return experimentsService.createExperiment(experimentsObj).should.be.rejected.then((err) => {
                createStub.called.should.equal(false)
                err.status.should.equal(400)
                err.errorMessage.should.equal("Invalid Experiment Design")
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects("Validation Failure")

            return experimentsService.createExperiment(experimentsObj).should.be.rejected.then((err) => {
                createStub.called.should.equal(false)
            })
        })
    })

    describe('Update Experiment:', () => {

        it('Success and Return experiment', ()=> {
            const experimentResObj = {
                'id': 30,
                'name': 'exp1002',
                'subjectType': 'plant',
                'reps': 20,
                'refExperimentDesignId': 2,
                'userId': 'akuma11',
                'status': 'ACTIVE'
            }
            const experimentReqObj = {
                'name': 'exp1002',
                'subjectType': 'plant',
                'reps': 20,
                'refExperimentDesignId': 2,
                'userId': 'akuma11',
                'status': 'ACTIVE'
            }
            updateStub.resolves(
                experimentResObj
            )
            validateStub.resolves()

            return experimentsService.updateExperiment(30, experimentReqObj).then((experiment)=> {
                experiment.id.should.equal(30)
                experiment.name.should.equal('exp1002')
                sinon.assert.calledWithExactly(
                    updateStub,
                    30,
                    sinon.match.same(experimentReqObj)
                )
            })
        })

        it('fails', () => {
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
            updateStub.rejects(testError)
            validateStub.resolves()

            return experimentsService.updateExperiment(30, experimentReqObj).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    updateStub,
                    30,
                    sinon.match.same(experimentReqObj)
                )
            })
        })

        it('fails When it returns no result', ()=> {
            updateStub.resolves(null)
            validateStub.resolves()
            const experimentReqObj = {
                'name': 'exp1002',
                'subjectType': 'plant',
                'reps': 20,
                'refExperimentDesignId': 2,
                'createdDate': '2016-10-05T15:19:12.026Z',
                'userId': 'akuma11',
                'status': 'ACTIVE'
            }

            return experimentsService.updateExperiment(30, experimentReqObj).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Experiment Not Found to Update')
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects()

            return experimentsService.updateExperiment(30, testPayload).should.be.rejected.then((err) => {
                updateStub.called.should.equal(false)
            })
        })
    })

    describe('Delete Experiment:', () => {

        it('Success and Return experimentId', ()=> {
            removeStub.resolves(30)
            return experimentsService.deleteExperiment(30).then((id)=> {
                id.should.equal(30)
            })
        })

        it('fails', () => {
            removeStub.rejects(testError)

            return experimentsService.deleteExperiment(30).should.be.rejected.then((err) => {
                err.should.equal(testError)
                removeStub.calledOnce.should.equal(true)
                sinon.assert.calledWithExactly(
                    removeStub,
                    30)
            })
        })

        it('fails When it returns no result', ()=> {
            removeStub.resolves(null)
            return experimentsService.deleteExperiment(30).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Experiment Not Found for requested experimentId')
            })

        })
    })
})