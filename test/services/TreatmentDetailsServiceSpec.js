const sinon = require('sinon')
const chai = require('chai')
const _ = require('lodash')
const TreatmentDetailsService = require('../../src/services/TreatmentDetailsService')
const AppUtil = require('../../src/services/utility/AppUtil')

describe('TreatmentDetailsService', () => {
    let target

    before(() => {
        target = new TreatmentDetailsService()
    })

    describe("getTreatmentWithDetails", ()=> {
        let treatmentServiceGetStub
        let combinationElementServiceStub

        before(() => {
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

    describe('manageAllTreatmentDetails', () => {
        const testError = {}
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

        it('handles add without combination elements in isolation', () => {
            const request = {
                adds: [{}]
            }
            batchCreateTreatmentsStub.resolves([{id: 1}])

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
                sinon.assert.notCalled(batchCreateCombinationElementsStub)
                sinon.assert.notCalled(batchUpdateTreatmentsStub)
                sinon.assert.notCalled(batchUpdateCombinationElementsStub)
                sinon.assert.notCalled(getCombinationElementsByTreatmentIdStub)
            })
        })

        it('handles update without combination elements in isolation', () => {
            const request = {
                updates: [{id:1}]
            }
            batchUpdateTreatmentsStub.resolves()
            getCombinationElementsByTreatmentIdStub.resolves([])

            return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
                sinon.assert.notCalled(deleteTreatmentStub)
                sinon.assert.notCalled(deleteCombinationElementStub)
                sinon.assert.notCalled(batchCreateTreatmentsStub)
                sinon.assert.notCalled(batchCreateCombinationElementsStub)
                sinon.assert.calledOnce(batchUpdateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateTreatmentsStub,
                    request.updates,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )
                sinon.assert.notCalled(batchUpdateCombinationElementsStub)
                sinon.assert.calledOnce(getCombinationElementsByTreatmentIdStub)
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    1,
                    sinon.match.same(testTx)
                )
            })
        })

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

        it('ignores empty updates array', () => {
            const request = {
                updates: []
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

        it('handles updates in isolation', () => {
            const request = {
                /**
                 * 1. Update treatment which has a combination element that is deleted.
                 * 2. Update treatment which has multiple combination elements that are deleted.
                 * 3. Update treatment which has a combination element that is added.
                 * 4. Update treatment which has multiple combination elements that are added.
                 * 5. Update treatment which has a combination element to update.
                 * 6. Update treatment which has multiple combination elements to update.
                 * 7. Update treatment which has the following:
                 *      a. delete combination element
                 *      b. update combination element
                 *      c. add combination element
                 */
                updates: [
                    {
                        id: 1,
                        combinationElements: []         // Loses combination element with ID 2
                    },
                    {
                        id: 3,
                        combinationElements: []         // Loses combination elements with IDs 4 and 5
                    },
                    {
                        id: 6,
                        combinationElements: [
                            {
                                testData: '6_1'
                            }
                        ]
                    },
                    {
                        id: 7,
                        combinationElements: [
                            {
                                testData: '7_1'
                            },
                            {
                                testData: '7_2'
                            }
                        ]
                    },
                    {
                        id: 8,
                        combinationElements: [
                            {
                                id: 9,
                                testData: '8_1'
                            }
                        ]
                    },
                    {
                        id: 10,
                        combinationElements: [
                            {
                                id: 11,
                                testData: '10_1'
                            },
                            {
                                id: 12,
                                testData: '10_2'
                            }
                        ]
                    },
                    {
                        id: 13,
                        combinationElements: [  // loses combination element with ID 14
                            {
                                id: 15,
                                testData: '13_1'
                            },
                            {
                                testData: '13_2'
                            }
                        ]
                    }
                ]
            }

            deleteCombinationElementStub.resolves()
            batchUpdateTreatmentsStub.resolves()
            batchUpdateCombinationElementsStub.resolves()

            getCombinationElementsByTreatmentIdStub.withArgs(1).resolves([{id: 2}])
            getCombinationElementsByTreatmentIdStub.withArgs(3).resolves([{id: 4},{id:5}])
            getCombinationElementsByTreatmentIdStub.withArgs(6).resolves([])
            getCombinationElementsByTreatmentIdStub.withArgs(7).resolves([])
            getCombinationElementsByTreatmentIdStub.withArgs(8).resolves([{id: 9}])
            getCombinationElementsByTreatmentIdStub.withArgs(10).resolves([{id: 11},{id: 12}])
            getCombinationElementsByTreatmentIdStub.withArgs(13).resolves([{id: 14},{id: 15}])

            return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
                sinon.assert.notCalled(deleteTreatmentStub)

                deleteCombinationElementStub.callCount.should.equal(4)
                sinon.assert.calledWithExactly(
                    deleteCombinationElementStub,
                    2,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    deleteCombinationElementStub,
                    4,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    deleteCombinationElementStub,
                    5,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    deleteCombinationElementStub,
                    14,
                    sinon.match.same(testTx)
                )

                sinon.assert.notCalled(batchCreateTreatmentsStub)

                sinon.assert.calledOnce(batchCreateCombinationElementsStub)
                sinon.assert.calledWithExactly(
                    batchCreateCombinationElementsStub,
                    sinon.match((value) => {
                        const expectedData = [
                            '6_1',
                            '7_1',
                            '7_2',
                            '13_2'
                        ]
                        const createdData = _.map(value, (element) => element.testData)
                        createdData.length.should.equal(expectedData.length)
                        const intersection = _.intersection(
                            createdData,
                            expectedData
                        )
                        intersection.length.should.equal(expectedData.length)

                        _.find(value,(x) => x.testData == '6_1').treatmentId.should.equal(6)
                        _.find(value,(x) => x.testData == '7_1').treatmentId.should.equal(7)
                        _.find(value,(x) => x.testData == '7_2').treatmentId.should.equal(7)
                        _.find(value,(x) => x.testData == '13_2').treatmentId.should.equal(13)

                        return true
                    }),
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchUpdateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateTreatmentsStub,
                    sinon.match((value) => {
                        const expectedData = [
                            1, 3, 6, 7, 8, 10, 13
                        ]
                        const updatedData = _.map(value, (element) => element.id)
                        updatedData.length.should.equal(expectedData.length)
                        const intersection = _.intersection(
                            updatedData,
                            expectedData
                        )
                        intersection.length.should.equal(expectedData.length)
                        return true
                    }),
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchUpdateCombinationElementsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateCombinationElementsStub,
                    sinon.match((value) => {
                        const expectedData = [
                            9, 11, 12, 15
                        ]
                        const updatedData = _.map(value, (element) => element.id)
                        updatedData.length.should.equal(expectedData.length)
                        const intersection = _.intersection(
                            updatedData,
                            expectedData
                        )
                        intersection.length.should.equal(expectedData.length)

                        _.find(value,(x) => x.testData == '8_1').treatmentId.should.equal(8)
                        _.find(value,(x) => x.testData == '10_1').treatmentId.should.equal(10)
                        _.find(value,(x) => x.testData == '10_2').treatmentId.should.equal(10)
                        _.find(value,(x) => x.testData == '13_1').treatmentId.should.equal(13)

                        return true
                    }),
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                getCombinationElementsByTreatmentIdStub.callCount.should.equal(7)
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    1,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    3,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    6,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    7,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    8,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    10,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    13,
                    sinon.match.same(testTx)
                )
            })
        })

        it('handles all operations simultaneously', () => {
            const request = {
                adds: [{combinationElements: [{}]}],
                updates: [
                    {
                        id: 3,
                        combinationElements: [  // loses combination element with ID 4
                            {
                                id: 5,
                                testData: '3_1'
                            },
                            {
                                testData: '3_2'
                            }
                        ]
                    }
                ],
                deletes: [6]
            }

            deleteTreatmentStub.resolves()
            deleteCombinationElementStub.resolves()
            batchCreateTreatmentsStub.resolves([{id: 1}])
            batchCreateCombinationElementsStub.resolves()
            batchUpdateTreatmentsStub.resolves()
            batchUpdateCombinationElementsStub.resolves()
            getCombinationElementsByTreatmentIdStub.withArgs(3).resolves([{id: 4},{id: 5}])

            return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
                sinon.assert.calledOnce(deleteTreatmentStub)
                sinon.assert.calledWithExactly(
                    deleteTreatmentStub,
                    6,
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(deleteCombinationElementStub)
                sinon.assert.calledWithExactly(
                    deleteCombinationElementStub,
                    4,
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchCreateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchCreateTreatmentsStub,
                    request.adds,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledTwice(batchCreateCombinationElementsStub)
                sinon.assert.calledWithExactly(
                    batchCreateCombinationElementsStub,
                    [{treatmentId: 1}],
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    batchCreateCombinationElementsStub,
                    [{treatmentId: 3, testData: '3_2'}],
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchUpdateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateTreatmentsStub,
                    request.updates,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchUpdateCombinationElementsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateCombinationElementsStub,
                    [{id: 5, testData: '3_1', treatmentId: 3}],
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(getCombinationElementsByTreatmentIdStub)
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    3,
                    sinon.match.same(testTx)
                )
            })
        })

        it('returns rejected promise when add treatment fails', () => {
            const request = {
                adds: [{combinationElements: [{}]}],
                updates: [
                    {
                        id: 3,
                        combinationElements: [  // loses combination element with ID 4
                            {
                                id: 5,
                                testData: '3_1'
                            },
                            {
                                testData: '3_2'
                            }
                        ]
                    }
                ],
                deletes: [6]
            }

            deleteTreatmentStub.resolves()
            deleteCombinationElementStub.resolves()
            batchCreateTreatmentsStub.rejects(testError)
            batchUpdateTreatmentsStub.resolves()
            batchUpdateCombinationElementsStub.resolves()
            getCombinationElementsByTreatmentIdStub.withArgs(3).resolves([{id: 4},{id: 5}])

            return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
                err.should.equal(testError)

                sinon.assert.calledOnce(deleteTreatmentStub)
                sinon.assert.calledWithExactly(
                    deleteTreatmentStub,
                    6,
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchCreateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchCreateTreatmentsStub,
                    request.adds,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.notCalled(batchCreateCombinationElementsStub)
            })
        })

        it('returns rejected promise when add combination element fails', () => {
            const request = {
                adds: [{combinationElements: [{}]}],
                updates: [
                    {
                        id: 3,
                        combinationElements: [  // loses combination element with ID 4
                            {
                                id: 5,
                                testData: '3_1'
                            },
                            {
                                testData: '3_2'
                            }
                        ]
                    }
                ],
                deletes: [6]
            }

            deleteTreatmentStub.resolves()
            deleteCombinationElementStub.resolves()
            batchCreateTreatmentsStub.resolves([{id: 1}])
            batchCreateCombinationElementsStub.rejects(testError)
            batchUpdateTreatmentsStub.resolves()
            batchUpdateCombinationElementsStub.resolves()
            getCombinationElementsByTreatmentIdStub.withArgs(3).resolves([{id: 4},{id: 5}])

            return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
                err.should.equal(testError)

                sinon.assert.calledOnce(deleteTreatmentStub)
                sinon.assert.calledWithExactly(
                    deleteTreatmentStub,
                    6,
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchCreateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchCreateTreatmentsStub,
                    request.adds,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.called(batchCreateCombinationElementsStub)
            })
        })

        it('returns rejected promise when update treatments fails', () => {
            const request = {
                adds: [{combinationElements: [{}]}],
                updates: [
                    {
                        id: 3,
                        combinationElements: [  // loses combination element with ID 4
                            {
                                id: 5,
                                testData: '3_1'
                            },
                            {
                                testData: '3_2'
                            }
                        ]
                    }
                ],
                deletes: [6]
            }

            deleteTreatmentStub.resolves()
            deleteCombinationElementStub.resolves()
            batchCreateTreatmentsStub.resolves([{id: 1}])
            batchCreateCombinationElementsStub.resolves()
            batchUpdateTreatmentsStub.rejects(testError)
            batchUpdateCombinationElementsStub.resolves()
            getCombinationElementsByTreatmentIdStub.withArgs(3).resolves([{id: 4},{id: 5}])

            return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
                err.should.equal(testError)

                sinon.assert.calledOnce(deleteTreatmentStub)
                sinon.assert.calledWithExactly(
                    deleteTreatmentStub,
                    6,
                    sinon.match.same(testTx)
                )

                sinon.assert.notCalled(deleteCombinationElementStub)

                sinon.assert.calledOnce(batchUpdateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateTreatmentsStub,
                    request.updates,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.notCalled(batchUpdateCombinationElementsStub)
                sinon.assert.notCalled(getCombinationElementsByTreatmentIdStub)
            })
        })

        it('returns rejected promise when update combination elements fails', () => {
            const request = {
                adds: [{combinationElements: [{}]}],
                updates: [
                    {
                        id: 3,
                        combinationElements: [  // loses combination element with ID 4
                            {
                                id: 5,
                                testData: '3_1'
                            },
                            {
                                testData: '3_2'
                            }
                        ]
                    }
                ],
                deletes: [6]
            }

            deleteTreatmentStub.resolves()
            deleteCombinationElementStub.resolves()
            batchCreateTreatmentsStub.resolves([{id: 1}])
            batchCreateCombinationElementsStub.resolves()
            batchUpdateTreatmentsStub.resolves()
            batchUpdateCombinationElementsStub.rejects(testError)
            getCombinationElementsByTreatmentIdStub.withArgs(3).resolves([{id: 4},{id: 5}])

            return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
                err.should.equal(testError)

                sinon.assert.calledOnce(deleteTreatmentStub)
                sinon.assert.calledWithExactly(
                    deleteTreatmentStub,
                    6,
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchUpdateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateTreatmentsStub,
                    request.updates,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchUpdateCombinationElementsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateCombinationElementsStub,
                    [{id: 5, testData: '3_1', treatmentId: 3}],
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(getCombinationElementsByTreatmentIdStub)
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    3,
                    sinon.match.same(testTx)
                )
            })
        })

        it('returns rejected promise when getting combination elements for treatment fails', () => {
            const request = {
                adds: [{combinationElements: [{}]}],
                updates: [
                    {
                        id: 3,
                        combinationElements: [  // loses combination element with ID 4
                            {
                                id: 5,
                                testData: '3_1'
                            },
                            {
                                testData: '3_2'
                            }
                        ]
                    }
                ],
                deletes: [6]
            }

            deleteTreatmentStub.resolves()
            deleteCombinationElementStub.resolves()
            batchCreateTreatmentsStub.resolves([{id: 1}])
            batchCreateCombinationElementsStub.resolves()
            batchUpdateTreatmentsStub.resolves()
            batchUpdateCombinationElementsStub.resolves()
            getCombinationElementsByTreatmentIdStub.withArgs(3).rejects(testError)

            return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
                err.should.equal(testError)

                sinon.assert.calledOnce(deleteTreatmentStub)
                sinon.assert.calledWithExactly(
                    deleteTreatmentStub,
                    6,
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchUpdateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateTreatmentsStub,
                    request.updates,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(getCombinationElementsByTreatmentIdStub)
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    3,
                    sinon.match.same(testTx)
                )
            })
        })

        it('returns rejected promise when delete treatment fails', () => {
            const request = {
                adds: [{combinationElements: [{}]}],
                updates: [
                    {
                        id: 3,
                        combinationElements: [  // loses combination element with ID 4
                            {
                                id: 5,
                                testData: '3_1'
                            },
                            {
                                testData: '3_2'
                            }
                        ]
                    }
                ],
                deletes: [6]
            }

            deleteTreatmentStub.rejects(testError)

            return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
                err.should.equal(testError)

                sinon.assert.calledOnce(deleteTreatmentStub)
                sinon.assert.calledWithExactly(
                    deleteTreatmentStub,
                    6,
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

        it('returns rejected promise when deleting combination elements fails', () => {
            const request = {
                adds: [{combinationElements: [{}]}],
                updates: [
                    {
                        id: 3,
                        combinationElements: [  // loses combination element with ID 4
                            {
                                id: 5,
                                testData: '3_1'
                            },
                            {
                                testData: '3_2'
                            }
                        ]
                    }
                ],
                deletes: [6]
            }

            deleteTreatmentStub.resolves()
            deleteCombinationElementStub.rejects(testError)
            batchCreateTreatmentsStub.resolves([{id: 1}])
            batchCreateCombinationElementsStub.resolves()
            batchUpdateTreatmentsStub.resolves()
            batchUpdateCombinationElementsStub.resolves()
            getCombinationElementsByTreatmentIdStub.withArgs(3).resolves([{id: 4},{id: 5}])

            return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
                err.should.equal(testError)

                sinon.assert.calledOnce(deleteTreatmentStub)
                sinon.assert.calledWithExactly(
                    deleteTreatmentStub,
                    6,
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(deleteCombinationElementStub)
                sinon.assert.calledWithExactly(
                    deleteCombinationElementStub,
                    4,
                    sinon.match.same(testTx)
                )

                sinon.assert.calledOnce(batchUpdateTreatmentsStub)
                sinon.assert.calledWithExactly(
                    batchUpdateTreatmentsStub,
                    request.updates,
                    sinon.match.same(testContext),
                    sinon.match.same(testTx)
                )

                sinon.assert.notCalled(batchUpdateCombinationElementsStub)

                sinon.assert.calledOnce(getCombinationElementsByTreatmentIdStub)
                sinon.assert.calledWithExactly(
                    getCombinationElementsByTreatmentIdStub,
                    3,
                    sinon.match.same(testTx)
                )
            })
        })
    })
})