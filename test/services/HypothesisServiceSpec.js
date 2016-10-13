/**
 * Created by kprat1 on 14/10/16.
 */
const sinon = require('sinon')
const chai = require('chai')
const ExperimentsService = require('../../src/services/ExperimentsService')
const HypothesisService = require('../../src/services/HypothesisService')
const db = require('../../src/db/DbManager')

const testPayload = {}
const testResponse = {}
const testError = {}
const tx = {}

let createStub
let experimentsService
let hypothesisService
let findStub
let getStub
let removeStub
let transactionStub
let updateStub
let validateStub

describe('HypothesisService', () => {
    before(() => {
        createStub = sinon.stub(db.hypothesis, 'create')
        experimentsService = new ExperimentsService()
        hypothesisService = new HypothesisService()
        findStub = sinon.stub(db.hypothesis, 'find')
        getStub = sinon.stub(db.hypothesis, 'all')
        removeStub = sinon.stub(db.hypothesis, 'remove')
        updateStub = sinon.stub(db.hypothesis, 'update')
    })

    after(() => {
        createStub.restore()
        findStub.restore()
        getStub.restore()
        removeStub.restore()
        updateStub.restore()
    })

    afterEach(() => {
        createStub.reset()
        findStub.reset()
        getStub.reset()
        removeStub.reset()
        updateStub.reset()
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
})