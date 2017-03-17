const sinon = require('sinon')
const chai = require('chai')
const ExperimentsService = require('../../src/services/ExperimentsService')
const db = require('../../src/db/DbManager')

describe('ExperimentsService', () => {
    const testPayload = {}
    const testResponse = {}
    const testError = {}
    const tx = {tx:{}}
    const context ={
        userId:"akuma11"
    }

    let batchCreateStub
    let expDesignFindStub
    let experimentsService
    let findStub
    let getStub
    let removeStub
    let transactionStub
    let updateStub
    let validateStub

    let getTagsByExperimentIdStub
    let batchCreateTagsStub
    let deleteTagsForExperimentIdStub

    before(() => {
        batchCreateStub = sinon.stub(db.experiments, 'batchCreate')
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

        getTagsByExperimentIdStub = sinon.stub(experimentsService._tagService, 'getTagsByExperimentId')
        batchCreateTagsStub = sinon.stub(experimentsService._tagService, 'batchCreateTags')
        deleteTagsForExperimentIdStub = sinon.stub(experimentsService._tagService, 'deleteTagsForExperimentId')
    })

    after(() => {
        batchCreateStub.restore()
        expDesignFindStub.restore()
        findStub.restore()
        getStub.restore()
        removeStub.restore()
        transactionStub.restore()
        updateStub.restore()
        validateStub.restore()

        getTagsByExperimentIdStub.restore()
        batchCreateTagsStub.restore()
        deleteTagsForExperimentIdStub.restore()
    })

    afterEach(() => {
        batchCreateStub.reset()
        expDesignFindStub.reset()
        findStub.reset()
        getStub.reset()
        removeStub.reset()
        transactionStub.reset()
        updateStub.reset()
        validateStub.reset()

        getTagsByExperimentIdStub.reset()
        batchCreateTagsStub.reset()
        deleteTagsForExperimentIdStub.reset()
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
            getTagsByExperimentIdStub.resolves([])

            return experimentsService.getExperimentById(30, tx).then((experiment)=> {
                sinon.assert.calledWithExactly(
                    findStub,
                    30,
                    sinon.match.same(tx))
                experiment.should.equal(testResponse)
            })
        })

        it('fails', () => {
            findStub.rejects(testError)

            return experimentsService.getExperimentById(30, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    findStub,
                    30,
                    sinon.match.same(tx))
            })
        })

        it('fails When it returns no result', ()=> {
            findStub.resolves(null)

            return experimentsService.getExperimentById(30, tx).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Experiment Not Found for requested experimentId')
                sinon.assert.calledWithExactly(
                    findStub,
                    30,
                    sinon.match.same(tx))
            })
        })

        it('fails when it cannot get tags', ()=>{
            findStub.resolves(testResponse)
            getTagsByExperimentIdStub.rejects("error")

            return experimentsService.getExperimentById(30, tx).should.be.rejected.then((err)=>{
                err.message.should.equal("error")
                sinon.assert.calledWithExactly(
                    findStub,
                    30,
                    sinon.match.same(tx)
                )
                sinon.assert.calledWithExactly(
                    getTagsByExperimentIdStub,
                    30,
                    sinon.match.same(tx)
                )
            })
        })

        it('gets experiment and tags', ()=>{
            findStub.resolves({id: 30, name: "testExp", description: "testDesc"})
            getTagsByExperimentIdStub.resolves([{name: "test", value: "testValue"}])

            return experimentsService.getExperimentById(30, tx).then((experiment)=>{
                experiment.tags.length.should.equal(1)
                experiment.tags[0].name.should.equal("test")
                experiment.tags[0].value.should.equal("testValue")
            })
        })
    })

    describe('create Experiments', () => {

        const experimentsObj = [{
            'name': 'exp1002',
            'description': 'Experiment Description',
            'refExperimentDesignId': 2,
            'userId': 'akuma11',
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
            batchCreateStub.resolves([{id: 1}])
            expDesignFindStub.resolves({id: 2})
            validateStub.resolves()

            return experimentsService.batchCreateExperiments(experimentsObj, context, tx).then((result) => {
                result.should.eql(expectedResult)
                batchCreateStub.calledOnce.should.equal(true)
                sinon.assert.calledWithExactly(
                    batchCreateStub,
                    sinon.match.same(experimentsObj),
                    sinon.match.same(context),
                    sinon.match.same(tx))
            })
        })

        it('succeeds and returns list of experiment ids with status and message for batch experiment create request', () => {
            experimentsObj.push(
                {
                    'name': 'exp1003',
                    'description': 'Experiment Description',
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
                    'id': 2
                }
            )

            batchCreateStub.resolves([{id: 1},{id:2}])
            expDesignFindStub.resolves({id: 2})
            validateStub.resolves()

            return experimentsService.batchCreateExperiments(experimentsObj, context, tx).then((result) => {
                result.should.eql(expectedResult)
                batchCreateStub.calledOnce.should.equal(true)
            })
        })

        it('fails', () => {
            batchCreateStub.rejects(testError)
            validateStub.resolves()

            return experimentsService.batchCreateExperiments(experimentsObj, context, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects("Validation Failure")

            return experimentsService.batchCreateExperiments(experimentsObj, context, tx).should.be.rejected.then(() => {
                batchCreateStub.called.should.equal(false)
            })
        })

        it("succeeds and creates tags for new experiments", ()=>{
            const tagsExperimentsObj = [{tags: [{}]}]
            const tagsObj = [{experimentId: 1}]

            batchCreateStub.resolves([{id: 1}])
            expDesignFindStub.resolves({id: 2})
            validateStub.resolves()

            batchCreateTagsStub.resolves()

            return experimentsService.batchCreateExperiments(tagsExperimentsObj, context, tx).then(() => {
                batchCreateStub.calledOnce.should.equal(true)
                batchCreateTagsStub.calledOnce.should.equal(true)
                sinon.assert.calledWithExactly(
                    batchCreateTagsStub,
                    tagsObj,
                    sinon.match.same(context),
                    sinon.match.same(tx)
                )
            })
        })

        it("fails due to failure to create tags", ()=>{
            const tagsExperimentsObj = [{tags: [{}]}]
            const tagsObj = [{experimentId: 1}]

            batchCreateStub.resolves([{id: 1}])
            expDesignFindStub.resolves({id: 2})
            validateStub.resolves()

            batchCreateTagsStub.rejects("error")

            return experimentsService.batchCreateExperiments(tagsExperimentsObj, context, tx).should.be.rejected.then((result) => {
                result.message.should.eql("error")
                batchCreateStub.calledOnce.should.equal(true)
                batchCreateTagsStub.calledOnce.should.equal(true)
                sinon.assert.calledWithExactly(
                    batchCreateTagsStub,
                    tagsObj,
                    sinon.match.same(context),
                    sinon.match.same(tx)
                )
            })
        })
    })

    describe('Update Experiment:', () => {

        it('Success and Return experiment', ()=> {
            const experimentResObj = {
                'id': 30,
                'name': 'exp1002',
                'description': 'Experiment Description',
                'refExperimentDesignId': 2,
                'userId': 'akuma11',
                'status': 'ACTIVE'
            }
            const experimentReqObj = {
                'name': 'exp1002',
                'description': 'Experiment Description',
                'refExperimentDesignId': 2,
                'userId': 'akuma11',
                'status': 'ACTIVE'
            }
            updateStub.resolves(
                experimentResObj
            )
            validateStub.resolves()
            expDesignFindStub.resolves({})
            deleteTagsForExperimentIdStub.resolves()
            batchCreateTagsStub.resolves()

            return experimentsService.updateExperiment(30, experimentReqObj, context, tx).then((experiment)=> {
                experiment.id.should.equal(30)
                experiment.name.should.equal('exp1002')
                sinon.assert.calledWithExactly(
                    updateStub,
                    30,
                    sinon.match.same(experimentReqObj),
                    context,
                    sinon.match.same(tx)
                )
            })
        })

        it('fails', () => {
            const experimentReqObj = {
                'name': 'exp1002',
                'description': 'Experiment Description',
                'refExperimentDesignId': 2,
                'createdDate': '2016-10-05T15:19:12.026Z',
                'createdUserId': 'akuma11',
                'modifiedUserId': 'akuma11',
                'modifiedDate': '2016-10-05T15:19:12.026Z',
                'status': 'ACTIVE'
            }
            updateStub.rejects(testError)
            validateStub.resolves()

            return experimentsService.updateExperiment(30, experimentReqObj, context, tx).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(
                    updateStub,
                    30,
                    sinon.match.same(experimentReqObj),
                    context,
                    sinon.match.same(tx)
                )
            })
        })

        it('fails When it returns no result', ()=> {
            updateStub.resolves(null)
            validateStub.resolves()
            const experimentReqObj = {
                'name': 'exp1002',
                'description': 'Experiment Description',
                'refExperimentDesignId': 2,
                'createdDate': '2016-10-05T15:19:12.026Z',
                'userId': 'akuma11',
                'status': 'ACTIVE'
            }

            return experimentsService.updateExperiment(30, experimentReqObj, context, tx).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Experiment Not Found to Update')
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects()

            return experimentsService.updateExperiment(30, testPayload, context, tx).should.be.rejected.then(() => {
                updateStub.called.should.equal(false)
            })
        })

        it("fails due to tag delete error", () => {
            validateStub.resolves()
            updateStub.resolves({})
            deleteTagsForExperimentIdStub.rejects("error")

            return experimentsService.updateExperiment(30, testPayload, context, tx).should.be.rejected.then((err)=>{
                batchCreateTagsStub.called.should.equal(false)
                err.message.should.equal("error")
            })
        })

        it("fails due to tag create error", () => {
            validateStub.resolves()
            updateStub.resolves({id:30})
            deleteTagsForExperimentIdStub.resolves()
            batchCreateTagsStub.rejects("error")
            const experimentsObj = {tags:[{}]}
            const tagsObj = [{experimentId: 30}]

            return experimentsService.updateExperiment(30, experimentsObj, context, tx).should.be.rejected.then((err)=>{
                sinon.assert.calledWithExactly(deleteTagsForExperimentIdStub, 30, tx)
                sinon.assert.calledWithExactly(
                    batchCreateTagsStub,
                    tagsObj,
                    context,
                    tx
                )
                err.message.should.equal("error")
            })
        })

        it("succeeds and creates new tags", () => {
            const experimentResObj = {
                'id': 30,
                'name': 'exp1002',
                'description': 'Experiment Description',
                'refExperimentDesignId': 2,
                'userId': 'akuma11',
                'status': 'ACTIVE',
            }
            const experimentReqObj = {
                'name': 'exp1002',
                'description': 'Experiment Description',
                'refExperimentDesignId': 2,
                'userId': 'akuma11',
                'status': 'ACTIVE',
                "tags": [{}]
            }
            const tagsObj = [
                {experimentId: 30}
            ]
            updateStub.resolves(
                experimentResObj
            )
            validateStub.resolves()
            expDesignFindStub.resolves({})
            deleteTagsForExperimentIdStub.resolves()
            batchCreateTagsStub.resolves()

            return experimentsService.updateExperiment(30, experimentReqObj, context, tx).then((experiment)=> {
                experiment.id.should.equal(30)
                experiment.name.should.equal('exp1002')
                sinon.assert.calledWithExactly(
                    updateStub,
                    30,
                    sinon.match.same(experimentReqObj),
                    context,
                    sinon.match.same(tx)
                )
                sinon.assert.calledWithExactly(deleteTagsForExperimentIdStub, 30, sinon.match.same(tx))
                sinon.assert.calledWithExactly(
                    batchCreateTagsStub,
                    tagsObj,
                    context,
                    sinon.match.same(tx),
                )
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