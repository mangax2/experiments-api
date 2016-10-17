/**
 * Created by kprat1 on 14/10/16.
 */
const sinon = require('sinon')
const chai = require('chai')
const HypothesisService = require('../../src/services/HypothesisService')
const db = require('../../src/db/DbManager')

const testPayload = {}
const testResponse = {}
const testError = {}
const tx = {}

let createStub
let createBatchStub
let experimentsService
let hypothesisService
let findStub
let getStub
let removeStub
let transactionStub
let updateStub
let validateStub
let businessKeyValidateStub
let getExperimentByIdStub
let getHypothesisByIdSub
let hypothesisValidator
let findByExperimentIdStub
let getByBusinessKeyStub

describe('HypothesisService', () => {
    before(() => {
        createStub = sinon.stub(db.hypothesis, 'create')
        createBatchStub = sinon.stub(db.hypothesis, 'batchCreate')
        hypothesisService = new HypothesisService()
        findStub = sinon.stub(db.hypothesis, 'find')
        getStub = sinon.stub(db.hypothesis, 'all')
        findByExperimentIdStub = sinon.stub(db.hypothesis, 'findByExperimentId')
        removeStub = sinon.stub(db.hypothesis, 'remove')
        updateStub = sinon.stub(db.hypothesis, 'update')
        getByBusinessKeyStub = sinon.stub(db.hypothesis, 'getHypothesisByExperimentAndDescriptionAndType')
        getExperimentByIdStub = sinon.stub(hypothesisService._experimentService, 'getExperimentById')
    })

    after(() => {
        createStub.restore()
        createBatchStub.restore()
        findStub.restore()
        getStub.restore()
        removeStub.restore()
        updateStub.restore()
        getExperimentByIdStub.restore()
        businessKeyValidateStub.restore()
        findByExperimentIdStub.restore()
        getByBusinessKeyStub.restore()
        findByExperimentIdStub.restore()

    })

    afterEach(() => {
        createStub.reset()
        createBatchStub.reset()
        findStub.reset()
        getStub.reset()
        removeStub.reset()
        updateStub.reset()
        getExperimentByIdStub.reset()
        getByBusinessKeyStub.reset()
        findByExperimentIdStub.reset()

    })

    describe('Get All Hypothesis:', () => {
        it('Success', ()=> {
            getStub.resolves(testResponse)

            return hypothesisService.getAllHypothesis().then((hypotheses)=> {
                sinon.assert.calledOnce(getStub)
                hypotheses.should.equal(testResponse)
            })
        })

        it('fails', () => {
            getStub.rejects(testError)
            return hypothesisService.getAllHypothesis().should.be.rejected.then((err) => {
                sinon.assert.calledWithExactly(getStub)
                err.should.equal(testError)
            })
        })
    })

    describe('Get Hypothesis By Id:', () => {
        it('Success and Return hypothesis with Id', ()=> {
            findStub.resolves(testResponse)

            return hypothesisService.getHypothesisById(30).then((hypothesis)=> {
                sinon.assert.calledWithExactly(findStub, 30)
                hypothesis.should.equal(testResponse)
            })
        })

        it('fails', () => {
            findStub.rejects(testError)

            return hypothesisService.getHypothesisById(30).should.be.rejected.then((err) => {
                err.should.equal(testError)
                sinon.assert.calledWithExactly(findStub, 30)
            })
        })

        it('fails When it returns no result', ()=> {
            findStub.resolves(null)

            return hypothesisService.getHypothesisById(30).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Hypothesis Not Found')
                sinon.assert.calledWithExactly(findStub, 30)
            })
        })
    })


    describe('Delete Hypothesis:', () => {

        it('Success and Return hypothesis', ()=> {
            removeStub.resolves(30)
            return hypothesisService.deleteHypothesis(30).then((id)=> {
                id.should.equal(30)
            })
        })

        it('fails', () => {
            removeStub.rejects(testError)
            return hypothesisService.deleteHypothesis(30).should.be.rejected.then((err) => {
                err.should.equal(testError)
                removeStub.calledOnce.should.equal(true)
                sinon.assert.calledWithExactly(
                    removeStub,
                    30)
            })
        })

        it('fails When it returns no result', ()=> {
            removeStub.resolves(null)
            return hypothesisService.deleteHypothesis(30).should.be.rejected.then((err) => {
                err.status.should.equal(404)
                err.message.should.equal('Hypothesis Not Found')
            })

        })
    })

    describe('Create Hypothesis:', ()=> {
        before(()=> {
            businessKeyValidateStub = sinon.stub(hypothesisService, 'getHypothesisByExperimentAndDescriptionAndType')
            validateStub = sinon.stub(hypothesisService, 'validateHypothesis')
        })
        it('Success', ()=> {
            validateStub.resolves()
            getExperimentByIdStub.resolves()
            businessKeyValidateStub.resolves()
            createBatchStub.resolves(1)
            return hypothesisService.createHypothesis(testPayload).then((response)=> {
                sinon.assert.calledOnce(validateStub)
                sinon.assert.calledOnce(createBatchStub)
                response.should.equal(1)
            })
        })
        it('fails', () => {
            createBatchStub.rejects(testError)
            validateStub.resolves()

            return hypothesisService.createHypothesis(testPayload).should.be.rejected.then((err) => {
                err.should.equal(testError)
            })
        })

        it('fails due to validation error', () => {
            validateStub.rejects()

            return hypothesisService.createHypothesis(testPayload).should.be.rejected.then((err) => {
                createBatchStub.called.should.equal(false)
            })
        })
        after(()=> {
            businessKeyValidateStub.restore()
            validateStub.restore()
        })
        afterEach(()=> {
            businessKeyValidateStub.reset()
            validateStub.reset()
        })

    })

    describe('Update Hypothesis:', ()=> {
        before(() => {
            getHypothesisByIdSub = sinon.stub(hypothesisService, 'getHypothesisById')
            hypothesisValidator = sinon.stub(hypothesisService._validator, 'validate')
            businessKeyValidateStub = sinon.stub(hypothesisService, 'getHypothesisByExperimentAndDescriptionAndType')
        })
        it('Success', ()=> {
            hypothesisValidator.resolves()
            getHypothesisByIdSub.resolves()
            businessKeyValidateStub.resolves()
            getExperimentByIdStub.resolves()
            updateStub.resolves(testResponse)
            return hypothesisService.updateHypothesis(20, testPayload).then((response)=> {
                sinon.assert.calledOnce(getExperimentByIdStub)
                sinon.assert.calledOnce(hypothesisValidator)
                sinon.assert.calledOnce(updateStub)
                sinon.assert.calledOnce(businessKeyValidateStub)
                sinon.assert.calledOnce(getHypothesisByIdSub)
                response.should.equal(testResponse)
            })
        })

        it('fails', () => {
            updateStub.rejects(testError)
            hypothesisValidator.resolves()
            getHypothesisByIdSub.resolves()
            businessKeyValidateStub.resolves()
            getExperimentByIdStub.resolves()

            return hypothesisService.updateHypothesis(20, testPayload).should.be.rejected.then((err) => {
                err.should.equal(testError)
            })
        })

        it('fails due to validation error', () => {
            hypothesisValidator.rejects()

            return hypothesisService.updateHypothesis(20, testPayload).should.be.rejected.then((err) => {
                updateStub.called.should.equal(false)
                businessKeyValidateStub.called.should.equal(false)
                getExperimentByIdStub.called.should.equal(false)
            })
        })

        it('fails due to experiment Id not found error', () => {
            hypothesisValidator.resolves()
            getHypothesisByIdSub.resolves()
            businessKeyValidateStub.resolves()
            getExperimentByIdStub.rejects()

            return hypothesisService.updateHypothesis(20, testPayload).should.be.rejected.then((err) => {
                updateStub.called.should.equal(false)
            })
        })

        it('fails due to Invalid Hypothesis Id', () => {
            hypothesisValidator.resolves()
            getHypothesisByIdSub.rejects()
            return hypothesisService.updateHypothesis(20, testPayload).should.be.rejected.then((err) => {
                updateStub.called.should.equal(false)
                getExperimentByIdStub.rejects().called.should.equal(false)
            })
        })

        it('Throws Error when hypothesis Exists for Businesskey during update for different hypothesis id', () => {
            hypothesisValidator.resolves()
            getHypothesisByIdSub.resolves()
            businessKeyValidateStub.resolves({id:21})

            const testPayloadNew = {experimentId: 10}

            return hypothesisService.updateHypothesis(20, testPayloadNew).should.be.rejected.then((err)=> {
                err.message.should.equal("Exact hypothesis already exist For the experimentId: 10")
            })
        })


        after(()=> {
            businessKeyValidateStub.restore()
            getHypothesisByIdSub.restore()
            hypothesisValidator.restore()
        })
        afterEach(()=> {
            businessKeyValidateStub.reset()
            getHypothesisByIdSub.reset()
            hypothesisValidator.reset()
        })
    })

    describe('Get Hypothesis by Experiment Id, Description and isNull Status:', ()=> {

        it('Success', ()=> {
            getByBusinessKeyStub.resolves(testResponse)
            return hypothesisService.getHypothesisByExperimentAndDescriptionAndType(1, "testDescription", false).then((response)=> {
                sinon.assert.calledOnce(getByBusinessKeyStub)
            })
        })
    })


    describe('Validate Hypothesis', ()=> {
        before(() => {
            getHypothesisByIdSub = sinon.stub(hypothesisService, 'getHypothesisById')
            hypothesisValidator = sinon.stub(hypothesisService._validator, 'validate')
            businessKeyValidateStub = sinon.stub(hypothesisService, 'getHypothesisByExperimentAndDescriptionAndType')
        })
        it('Throws Error when hypothesis Exists for Businesskey during validate', ()=> {
            hypothesisValidator.resolves()
            getExperimentByIdStub.resolves()
            businessKeyValidateStub.resolves({})
            const testPayloadNew = [{experimentId: 10}]
            return hypothesisService.createHypothesis(testPayloadNew).should.be.rejected.then((err)=> {
                err.message.should.equal("Exact hypothesis already exist For the experimentId: 10")
            })
        })
    })


    describe('Get Hypothesis By experiment Id:', () => {

        it('Success and Return hypotheses list', ()=> {
            getExperimentByIdStub.resolves({})
            findByExperimentIdStub.resolves(testResponse)

            return hypothesisService.getHypothesesByExperimentId(1).then((hypothesis)=> {
                sinon.assert.calledWithExactly(findByExperimentIdStub, 1)
                hypothesis.should.equal(testResponse)
            })
        })

        it('fails', () => {
            getExperimentByIdStub.rejects()
            return hypothesisService.getHypothesesByExperimentId(-1).should.be.rejected.then((err) => {
                findByExperimentIdStub.called.should.equal(false)
            })
        })

    })


})