const sinon = require('sinon')
const chai = require('chai')
const TreatmentDetailsService = require('../../src/services/TreatmentDetailsService')
const AppUtil = require('../../src/services/utility/AppUtil')

describe('TreatmentDetailsService', () => {
    describe("getTreatmentWithDetails", ()=> {
        let target

        let treatmentServiceGetStub
        let combinationElementServiceStub

        before(() => {
            target = new TreatmentDetailsService()
            combinationElementServiceStub = sinon.stub(target._combinationElementService, 'getCombinationElementsByTreatmentId')
            treatmentServiceGetStub = sinon.stub(target._treatmentService, 'getTreatmentsByExperimentId')
        })
        afterEach(() => {
            combinationElementServiceStub.reset()
            treatmentServiceGetStub.reset()
        })
        after(() => {
            combinationElementServiceStub.restore()
            treatmentServiceGetStub.restore()
        })

        describe('getAllTreatmentDetails', () => {
            let getCombinationElementsPromisesStub

            before(() => {
                getCombinationElementsPromisesStub = sinon.stub(target, '_getCombinationElementsPromises')
            })
            afterEach(() => {
                getCombinationElementsPromisesStub.reset()
            })
            after(() => {
                getCombinationElementsPromisesStub.restore()
            })

            it('rejects when treatment service fails to get treatments', () => {
                treatmentServiceGetStub.rejects()

                return target.getAllTreatmentDetails(1).should.be.rejected
            })

            it('passes treatments to _getCombinationElementsPromises, which fails', () => {
                getCombinationElementsPromisesStub.rejects()

                return target.getAllTreatmentDetails(1).should.be.rejected
            })

            it('passes treatments to _getCombinationElementPromises which returns empty', () => {
                treatmentServiceGetStub.resolves([{id: 1}])
                getCombinationElementsPromisesStub.returns([Promise.resolve([])])

                return target.getAllTreatmentDetails(1).then((r) => {
                    r.should.deep.equal([{id: 1, combinationElements: []}])
                })
            })

            it('passes treatments to _getCombinationElementPromises which returns some elements', () => {
                treatmentServiceGetStub.resolves([{id: 1}])
                getCombinationElementsPromisesStub.returns([Promise.resolve([{id: 1, name: 'TestN', value: 'TestV'}])])

                return target.getAllTreatmentDetails(1).then((r) => {
                    r.length.should.equal(1)
                    r[0].id.should.equal(1)
                    r[0].combinationElements.length.should.equal(1)
                    r[0].combinationElements[0].id.should.equal(1)
                    r[0].combinationElements[0].name.should.equal('TestN')
                    r[0].combinationElements[0].value.should.equal('TestV')

                })
            })

            it('passes treatments to _getCombinationElementPromises which returns some elements and some empty', () => {
                treatmentServiceGetStub.resolves([{id: 1}, {id: 2}])
                getCombinationElementsPromisesStub.returns([Promise.resolve([{id: 1, name: 'TestN', value: 'TestV'}]), Promise.resolve([])])

                return target.getAllTreatmentDetails(1).then((r) => {
                    r.length.should.equal(2)
                    r[0].id.should.equal(1)
                    r[0].combinationElements.length.should.equal(1)
                    r[0].combinationElements[0].id.should.equal(1)
                    r[0].combinationElements[0].name.should.equal('TestN')
                    r[0].combinationElements[0].value.should.equal('TestV')

                    r[1].id.should.equal(2)
                    r[1].combinationElements.length.should.equal(0)
                })
            })
        })

        describe('_getCombinationElementsPromises', () => {
            it('returns an empty array if treatments are empty', () => {

                const promises = target._getCombinationElementsPromises([])

                promises.length.should.equal(0)
            })

            it('returns an empty array if treatments are undefined', () => {

                const promises = target._getCombinationElementsPromises(undefined)

                promises.length.should.equal(0)
            })
            it('returns an empty array if treatments are null', () => {

                const promises = target._getCombinationElementsPromises(null)

                promises.length.should.equal(0)
            })
            it('calls combinationElementService for each treatment', () => {
                const treatments = [{},{}]

                combinationElementServiceStub.returns(new Promise((resolve, reject) => {}))

                const promises = target._getCombinationElementsPromises(treatments)

                combinationElementServiceStub.calledTwice.should.equal(true)

                promises.length.should.equal(2)
            })
        })
    })



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