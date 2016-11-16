const sinon = require('sinon')
const chai = require('chai')
const TreatmentDetailsService = require('../../src/services/TreatmentDetailsService')
const AppUtil = require('../../src/services/utility/AppUtil')

describe('TreatmentDetailsService', () => {
    // Get after this line



    // Post after this line
    describe('allPostStuff', () => {
        let target

        const testContext = {}
        const testTx = {tx:{}}

        let deleteTreatmentStub
        let deleteCombinationElementStub
        let batchCreateTreatmentsStub
        let batchCreateCombinationElementsStub
        let batchUpdateTreatmentsStub
        let batchUpdateCombinationElementsStub
        let getCombinationElementsByTreatmentIdStub

        before(() => {
            target = new TreatmentDetailsService()

            deleteTreatmentStub = sinon.stub(target._treatmentService, 'deleteTreatment')
            deleteCombinationElementStub = sinon.stub(target._combinationElementService, 'deleteCombinationElement')
            batchCreateTreatmentsStub = sinon.stub(target._treatmentService, 'batchCreateTreatments')
            batchCreateCombinationElementsStub = sinon.stub(target._combinationElementService, 'batchCreateCombinationElements')
            batchUpdateTreatmentsStub = sinon.stub(target._treatmentService, 'batchUpdateTreatments')
            batchUpdateCombinationElementsStub = sinon.stub(target._combinationElementService, 'batchUpdateCombinationElements')
            getCombinationElementsByTreatmentIdStub = sinon.stub(target._combinationElementService, 'getCombinationElementsByTreatmentId')
        })

        afterEach(() => {
            deleteTreatmentStub.reset()
            deleteCombinationElementStub.reset()
            batchCreateTreatmentsStub.reset()
            batchCreateCombinationElementsStub.reset()
            batchUpdateTreatmentsStub.reset()
            batchUpdateCombinationElementsStub.reset()
            getCombinationElementsByTreatmentIdStub.reset()
        })

        after(() => {
            deleteTreatmentStub.restore()
            deleteCombinationElementStub.restore()
            batchCreateTreatmentsStub.restore()
            batchCreateCombinationElementsStub.restore()
            batchUpdateTreatmentsStub.restore()
            batchUpdateCombinationElementsStub.restore()
            getCombinationElementsByTreatmentIdStub.restore()
        })

        describe('manageAllTreatmentDetailsEnd2End', () => {
            it('handles adds in isolation', () => {
                const request = {
                    adds: [
                        {},                                 // undefined combination elements
                        {combinationElements: []},          // empty array of combination elements
                        {combinationElements: [{}]},        // array of single element combination elements
                        {combinationElements: [{}, {}]}     // array of multiple combination elements
                    ]
                }
                batchCreateTreatmentsStub.resolves([{id: 1},{id: 2},{id: 3},{id: 4}])
                batchCreateCombinationElementsStub.resolves()

                return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
                    sinon.assert.notCalled(deleteTreatmentStub)
                    sinon.assert.notCalled(deleteCombinationElementStub)
                    sinon.assert.calledOnce(batchCreateTreatmentsStub)
                    sinon.assert.calledWithExactly(
                        batchCreateTreatmentsStub,
                        request.adds,
                        sinon.match.same(testContext),
                        sinon.match.same(testTx)
                    )
                    sinon.assert.calledOnce(batchCreateCombinationElementsStub)
                    sinon.assert.calledWithExactly(
                        batchCreateCombinationElementsStub,
                        [{treatmentId: 3}, {treatmentId: 4}, {treatmentId: 4}],
                        sinon.match.same(testContext),
                        sinon.match.same(testTx)
                    )
                    sinon.assert.notCalled(batchUpdateTreatmentsStub)
                    sinon.assert.notCalled(batchUpdateCombinationElementsStub)
                    sinon.assert.notCalled(getCombinationElementsByTreatmentIdStub)
                })
            })

            it('ignores deletes with empty array', () => {
                const request = {
                    deletes: []
                }

                return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
                    sinon.assert.notCalled(deleteTreatmentStub)
                    sinon.assert.notCalled(deleteCombinationElementStub)
                    sinon.assert.notCalled(batchCreateTreatmentsStub)
                    sinon.assert.notCalled(batchCreateCombinationElementsStub)
                    sinon.assert.notCalled(batchUpdateTreatmentsStub)
                    sinon.assert.notCalled(batchUpdateCombinationElementsStub)
                    sinon.assert.notCalled(getCombinationElementsByTreatmentIdStub)
                })
            })

            it('handles single delete in isolation', () => {
                const request = {
                    deletes: [1]
                }

                return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
                    sinon.assert.calledOnce(deleteTreatmentStub)
                    sinon.assert.calledWithExactly(
                        deleteTreatmentStub,
                        1,
                        sinon.match.same(testTx)
                    )
                    sinon.assert.notCalled(deleteCombinationElementStub)
                    sinon.assert.notCalled(batchCreateTreatmentsStub)
                    sinon.assert.notCalled(batchCreateCombinationElementsStub)
                    sinon.assert.notCalled(batchUpdateTreatmentsStub)
                    sinon.assert.notCalled(batchUpdateCombinationElementsStub)
                    sinon.assert.notCalled(getCombinationElementsByTreatmentIdStub)
                })
            })

            it('handles multiple deletes in isolation', () => {
                const request = {
                    deletes: [1, 2]
                }

                return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
                    sinon.assert.calledTwice(deleteTreatmentStub)
                    sinon.assert.calledWithExactly(
                        deleteTreatmentStub,
                        1,
                        sinon.match.same(testTx)
                    )
                    sinon.assert.calledWithExactly(
                        deleteTreatmentStub,
                        2,
                        sinon.match.same(testTx)
                    )
                    sinon.assert.notCalled(deleteCombinationElementStub)
                    sinon.assert.notCalled(batchCreateTreatmentsStub)
                    sinon.assert.notCalled(batchCreateCombinationElementsStub)
                    sinon.assert.notCalled(batchUpdateTreatmentsStub)
                    sinon.assert.notCalled(batchUpdateCombinationElementsStub)
                    sinon.assert.notCalled(getCombinationElementsByTreatmentIdStub)
                })
            })

            it('handles updates in isolation', () => {

            })

            it('handles all operations', () => {

            })
        })
    })
})