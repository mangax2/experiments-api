const sinon = require('sinon')
const chai = require('chai')
const _ = require('lodash')
const TreatmentDetailsService = require('../../src/services/TreatmentDetailsService')
const AppUtil = require('../../src/services/utility/AppUtil')
const expect = require('chai').expect

describe('TreatmentDetailsService', () => {
  let target
  const testTx = {
    tx: {},
  }
  const testError = {}

  before(() => {
    target = new TreatmentDetailsService()
  })

  describe('getTreatmentWithDetails', () => {
    let treatmentServiceGetStub
    let batchGetCombinationElementsByTreatmentIdsNoValidateStub

    before(() => {
      batchGetCombinationElementsByTreatmentIdsNoValidateStub =
        sinon.stub(target.combinationElementService, 'batchGetCombinationElementsByTreatmentIdsNoValidate')
      treatmentServiceGetStub = sinon.stub(target.treatmentService, 'getTreatmentsByExperimentId')
    })
    afterEach(() => {
      batchGetCombinationElementsByTreatmentIdsNoValidateStub.reset()
      treatmentServiceGetStub.reset()
    })
    after(() => {
      batchGetCombinationElementsByTreatmentIdsNoValidateStub.restore()
      treatmentServiceGetStub.restore()
    })

    describe('getAllTreatmentDetails', () => {
      it('rejects when treatment service fails to get treatments', () => {
        treatmentServiceGetStub.rejects(testError)

        return target.getAllTreatmentDetails(1, testTx).should.be.rejected.then((err) => {
          err.should.equal(testError)
          sinon.assert.calledWithExactly(
            treatmentServiceGetStub,
            1,
            sinon.match.same(testTx),
          )
        })
      })

      it('rejects when batchGetCombinationElementsByTreatmentIdsNoValidate fails', () => {
        treatmentServiceGetStub.resolves([{ id: 7 }])
        batchGetCombinationElementsByTreatmentIdsNoValidateStub.rejects(testError)

        return target.getAllTreatmentDetails(1, testTx).should.be.rejected.then((err) => {
          err.should.equal(testError)
          sinon.assert.calledWithExactly(
            treatmentServiceGetStub,
            1,
            sinon.match.same(testTx),
          )
          sinon.assert.calledWithExactly(
            batchGetCombinationElementsByTreatmentIdsNoValidateStub,
            [7],
            sinon.match.same(testTx),
          )
        })
      })

      it('succeeds when all calls are successful and there are no combination elements', () => {
        treatmentServiceGetStub.resolves([{ id: 7 }, { id: 11 }])
        batchGetCombinationElementsByTreatmentIdsNoValidateStub.resolves([[], []])

        return target.getAllTreatmentDetails(1, testTx).then((data) => {
          expect(data.length).to.equal(2)
          expect(data[0].combinationElements).to.eql([])
          expect(data[1].combinationElements).to.eql([])
          sinon.assert.calledWithExactly(
            treatmentServiceGetStub,
            1,
            sinon.match.same(testTx),
          )
          sinon.assert.calledWithExactly(
            batchGetCombinationElementsByTreatmentIdsNoValidateStub,
            [7, 11],
            sinon.match.same(testTx),
          )
        })
      })

      it('succeeds when all calls are successful and there are combination elements', () => {
        treatmentServiceGetStub.resolves([{ id: 7 }, { id: 11 }])
        batchGetCombinationElementsByTreatmentIdsNoValidateStub.resolves([[1], [2, 3]])

        return target.getAllTreatmentDetails(1, testTx).then((data) => {
          expect(data.length).to.equal(2)
          expect(data[0].combinationElements).to.eql([1])
          expect(data[1].combinationElements).to.eql([2, 3])
          sinon.assert.calledWithExactly(
            treatmentServiceGetStub,
            1,
            sinon.match.same(testTx),
          )
          sinon.assert.calledWithExactly(
            batchGetCombinationElementsByTreatmentIdsNoValidateStub,
            [7, 11],
            sinon.match.same(testTx),
          )
        })
      })
    })
  })

  describe('manageAllTreatmentDetails', () => {
    const testError = {}
    const testContext = {}
    const testTx = { tx: {} }

    let batchDeleteTreatmentsStub
    let batchDeleteCombinationElementsStub
    let batchCreateTreatmentsStub
    let batchCreateCombinationElementsStub
    let batchUpdateTreatmentsStub
    let batchUpdateCombinationElementsStub
    let batchGetCombinationElementsByTreatmentIdStub

    before(() => {
      batchDeleteTreatmentsStub = sinon.stub(target.treatmentService, 'batchDeleteTreatments')
      batchDeleteCombinationElementsStub = sinon.stub(target.combinationElementService, 'batchDeleteCombinationElements')
      batchCreateTreatmentsStub = sinon.stub(target.treatmentService, 'batchCreateTreatments')
      batchCreateCombinationElementsStub = sinon.stub(target.combinationElementService, 'batchCreateCombinationElements')
      batchUpdateTreatmentsStub = sinon.stub(target.treatmentService, 'batchUpdateTreatments')
      batchUpdateCombinationElementsStub = sinon.stub(target.combinationElementService, 'batchUpdateCombinationElements')
      batchGetCombinationElementsByTreatmentIdStub = sinon.stub(target.combinationElementService, 'batchGetCombinationElementsByTreatmentIds')
    })

    afterEach(() => {
      batchDeleteTreatmentsStub.reset()
      batchDeleteCombinationElementsStub.reset()
      batchCreateTreatmentsStub.reset()
      batchCreateCombinationElementsStub.reset()
      batchUpdateTreatmentsStub.reset()
      batchUpdateCombinationElementsStub.reset()
      batchGetCombinationElementsByTreatmentIdStub.reset()
    })

    after(() => {
      batchDeleteTreatmentsStub.restore()
      batchDeleteCombinationElementsStub.restore()
      batchCreateTreatmentsStub.restore()
      batchCreateCombinationElementsStub.restore()
      batchUpdateTreatmentsStub.restore()
      batchUpdateCombinationElementsStub.restore()
      batchGetCombinationElementsByTreatmentIdStub.restore()
    })

    it('performs treatment modifications in the following order: delete, update, then create', () => {
      let callIndex = 0
      let deleteCallIndex = -1
      let updateCallIndex = -1
      let createCallIndex = -1
      const service = new TreatmentDetailsService()
      sinon.stub(service, 'deleteTreatments', () => {
        deleteCallIndex = callIndex
        callIndex++
        return Promise.resolve()
      })
      sinon.stub(service, 'updateTreatments', () => {
        updateCallIndex = callIndex
        callIndex++
        return Promise.resolve()
      })
      sinon.stub(service, 'createTreatments', () => {
        createCallIndex = callIndex
        callIndex++
        return Promise.resolve()
      })

      return service.manageAllTreatmentDetails({}, testContext, testTx).then(() => {
        deleteCallIndex.should.equal(0)
        updateCallIndex.should.equal(1)
        createCallIndex.should.equal(2)
      })
    })

    it('performs combination element modifications in the following order: delete, update, then create', () => {
      let callIndex = 0
      let deleteCallIndex = -1
      let updateCallIndex = -1
      let createCallIndex = -1
      const service = new TreatmentDetailsService()
      sinon.stub(service, 'assembleBatchCreateCombinationElementsRequestFromUpdates').returns([])
      sinon.stub(service, 'assembleBatchUpdateCombinationElementsRequestFromUpdates').returns([])
      sinon.stub(service.treatmentService, 'batchUpdateTreatments').returns(Promise.resolve())
      sinon.stub(service, 'deleteCombinationElements', () => {
        deleteCallIndex = callIndex
        callIndex++
        return Promise.resolve()
      })
      sinon.stub(service, 'updateCombinationElements', () => {
        updateCallIndex = callIndex
        callIndex++
        return Promise.resolve()
      })
      sinon.stub(service, 'createCombinationElements', () => {
        createCallIndex = callIndex
        callIndex++
        return Promise.resolve()
      })

      return service.updateTreatments(['this makes length more than zero'], testContext, testTx).then(() => {
        deleteCallIndex.should.equal(0)
        updateCallIndex.should.equal(1)
        createCallIndex.should.equal(2)
      })
    })

    it('handles add without combination elements in isolation', () => {
      const request = {
        adds: [{}],
      }
      batchCreateTreatmentsStub.resolves([{ id: 1 }])

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.notCalled(batchDeleteTreatmentsStub)
        sinon.assert.notCalled(batchDeleteCombinationElementsStub)
        sinon.assert.calledOnce(batchCreateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchCreateTreatmentsStub,
          request.adds,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchCreateCombinationElementsStub)
        sinon.assert.notCalled(batchUpdateTreatmentsStub)
        sinon.assert.notCalled(batchUpdateCombinationElementsStub)
        sinon.assert.notCalled(batchGetCombinationElementsByTreatmentIdStub)
      })
    })

    it('handles update without combination elements in isolation', () => {
      const request = {
        updates: [{ id: 1 }],
      }
      batchUpdateTreatmentsStub.resolves()
      batchGetCombinationElementsByTreatmentIdStub.resolves([[]])

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.notCalled(batchDeleteTreatmentsStub)
        sinon.assert.notCalled(batchDeleteCombinationElementsStub)
        sinon.assert.notCalled(batchCreateTreatmentsStub)
        sinon.assert.notCalled(batchCreateCombinationElementsStub)
        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          request.updates,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchUpdateCombinationElementsStub)
        sinon.assert.calledOnce(batchGetCombinationElementsByTreatmentIdStub)
        sinon.assert.calledWithExactly(
          batchGetCombinationElementsByTreatmentIdStub,
          [1],
          sinon.match.same(testTx),
        )
      })
    })

    it('handles adds in isolation', () => {
      const request = {
        adds: [
          {},                                 // undefined combination elements
          { combinationElements: [] },          // empty array of combination elements
          { combinationElements: [{}] },        // array of single element combination elements
          { combinationElements: [{}, {}] }     // array of multiple combination elements
        ],
      }
      batchCreateTreatmentsStub.resolves([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
      batchCreateCombinationElementsStub.resolves()

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.notCalled(batchDeleteTreatmentsStub)
        sinon.assert.notCalled(batchDeleteCombinationElementsStub)
        sinon.assert.calledOnce(batchCreateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchCreateTreatmentsStub,
          request.adds,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.calledOnce(batchCreateCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchCreateCombinationElementsStub,
          [{ treatmentId: 3 }, { treatmentId: 4 }, { treatmentId: 4 }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchUpdateTreatmentsStub)
        sinon.assert.notCalled(batchUpdateCombinationElementsStub)
        sinon.assert.notCalled(batchGetCombinationElementsByTreatmentIdStub)
      })
    })

    it('ignores deletes with empty array', () => {
      const request = {
        deletes: [],
      }

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.notCalled(batchDeleteTreatmentsStub)
        sinon.assert.notCalled(batchDeleteCombinationElementsStub)
        sinon.assert.notCalled(batchCreateTreatmentsStub)
        sinon.assert.notCalled(batchCreateCombinationElementsStub)
        sinon.assert.notCalled(batchUpdateTreatmentsStub)
        sinon.assert.notCalled(batchUpdateCombinationElementsStub)
        sinon.assert.notCalled(batchGetCombinationElementsByTreatmentIdStub)
      })
    })

    it('handles single delete in isolation', () => {
      const request = {
        deletes: [1],
      }

      batchDeleteTreatmentsStub.resolves()

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [1],
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchDeleteCombinationElementsStub)
        sinon.assert.notCalled(batchCreateTreatmentsStub)
        sinon.assert.notCalled(batchCreateCombinationElementsStub)
        sinon.assert.notCalled(batchUpdateTreatmentsStub)
        sinon.assert.notCalled(batchUpdateCombinationElementsStub)
        sinon.assert.notCalled(batchGetCombinationElementsByTreatmentIdStub)
      })
    })

    it('handles multiple deletes in isolation', () => {
      const request = {
        deletes: [1, 2],
      }

      batchDeleteTreatmentsStub.resolves()

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [1, 2],
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchDeleteCombinationElementsStub)
        sinon.assert.notCalled(batchCreateTreatmentsStub)
        sinon.assert.notCalled(batchCreateCombinationElementsStub)
        sinon.assert.notCalled(batchUpdateTreatmentsStub)
        sinon.assert.notCalled(batchUpdateCombinationElementsStub)
        sinon.assert.notCalled(batchGetCombinationElementsByTreatmentIdStub)
      })
    })

    it('ignores empty updates array', () => {
      const request = {
        updates: [],
      }

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.notCalled(batchDeleteTreatmentsStub)
        sinon.assert.notCalled(batchDeleteCombinationElementsStub)
        sinon.assert.notCalled(batchCreateTreatmentsStub)
        sinon.assert.notCalled(batchCreateCombinationElementsStub)
        sinon.assert.notCalled(batchUpdateTreatmentsStub)
        sinon.assert.notCalled(batchUpdateCombinationElementsStub)
        sinon.assert.notCalled(batchGetCombinationElementsByTreatmentIdStub)
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
                testData: '6_1',
              },
            ],
          },
          {
            id: 7,
            combinationElements: [
              {
                testData: '7_1',
              },
              {
                testData: '7_2',
              },
            ],
          },
          {
            id: 8,
            combinationElements: [
              {
                id: 9,
                testData: '8_1',
              },
            ],
          },
          {
            id: 10,
            combinationElements: [
              {
                id: 11,
                testData: '10_1',
              },
              {
                id: 12,
                testData: '10_2',
              },
            ],
          },
          {
            id: 13,
            combinationElements: [  // loses combination element with ID 14
              {
                id: 15,
                testData: '13_1',
              },
              {
                testData: '13_2',
              },
            ],
          },
        ],
      }

      batchDeleteCombinationElementsStub.resolves()
      batchUpdateTreatmentsStub.resolves()
      batchUpdateCombinationElementsStub.resolves()

      batchGetCombinationElementsByTreatmentIdStub.withArgs([1, 3, 6, 7, 8, 10, 13]).resolves([
        [{ id: 2 }],
        [{ id: 4 }, { id: 5 }],
        [],
        [],
        [{ id: 9 }],
        [{ id: 11 }, { id: 12 }],
        [{ id: 14 }, { id: 15 }],
      ])

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.notCalled(batchDeleteTreatmentsStub)

        sinon.assert.calledOnce(batchDeleteCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchDeleteCombinationElementsStub,
          [2, 4, 5, 14],
          sinon.match.same(testTx),
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
              '13_2',
            ]
            const createdData = _.map(value, (element) => element.testData)
            createdData.length.should.equal(expectedData.length)
            const intersection = _.intersection(
              createdData,
              expectedData,
            )
            intersection.length.should.equal(expectedData.length)

            _.find(value, (x) => x.testData == '6_1').treatmentId.should.equal(6)
            _.find(value, (x) => x.testData == '7_1').treatmentId.should.equal(7)
            _.find(value, (x) => x.testData == '7_2').treatmentId.should.equal(7)
            _.find(value, (x) => x.testData == '13_2').treatmentId.should.equal(13)

            return true
          }),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          sinon.match((value) => {
            const expectedData = [
              1, 3, 6, 7, 8, 10, 13,
            ]
            const updatedData = _.map(value, (element) => element.id)
            updatedData.length.should.equal(expectedData.length)
            const intersection = _.intersection(
              updatedData,
              expectedData,
            )
            intersection.length.should.equal(expectedData.length)
            return true
          }),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchUpdateCombinationElementsStub,
          sinon.match((value) => {
            const expectedData = [
              9, 11, 12, 15,
            ]
            const updatedData = _.map(value, (element) => element.id)
            updatedData.length.should.equal(expectedData.length)
            const intersection = _.intersection(
              updatedData,
              expectedData,
            )
            intersection.length.should.equal(expectedData.length)

            _.find(value, (x) => x.testData == '8_1').treatmentId.should.equal(8)
            _.find(value, (x) => x.testData == '10_1').treatmentId.should.equal(10)
            _.find(value, (x) => x.testData == '10_2').treatmentId.should.equal(10)
            _.find(value, (x) => x.testData == '13_1').treatmentId.should.equal(13)

            return true
          }),
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchGetCombinationElementsByTreatmentIdStub)
        sinon.assert.calledWithExactly(
          batchGetCombinationElementsByTreatmentIdStub,
          [1, 3, 6, 7, 8, 10, 13],
          sinon.match.same(testTx),
        )
      })
    })

    it('handles all operations simultaneously', () => {
      const request = {
        adds: [{ combinationElements: [{}] }],
        updates: [
          {
            id: 3,
            combinationElements: [  // loses combination element with ID 4
              {
                id: 5,
                testData: '3_1',
              },
              {
                testData: '3_2',
              },
            ],
          },
        ],
        deletes: [6],
      }

      batchDeleteTreatmentsStub.resolves()
      batchUpdateTreatmentsStub.resolves()
      batchGetCombinationElementsByTreatmentIdStub.withArgs([3]).resolves([[{ id: 4 }, { id: 5 }]])
      batchDeleteCombinationElementsStub.resolves()
      batchUpdateCombinationElementsStub.resolves()
      batchCreateCombinationElementsStub.resolves()
      batchCreateTreatmentsStub.resolves([{ id: 1 }])

      return target.manageAllTreatmentDetails(request, testContext, testTx).then(() => {
        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [6],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          request.updates,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchGetCombinationElementsByTreatmentIdStub)
        sinon.assert.calledWithExactly(
          batchGetCombinationElementsByTreatmentIdStub,
          [3],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchDeleteCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchDeleteCombinationElementsStub,
          [4],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchUpdateCombinationElementsStub,
          [{ id: 5, testData: '3_1', treatmentId: 3 }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledTwice(batchCreateCombinationElementsStub)
        // Combination elements created through treatment update
        sinon.assert.calledWithExactly(
          batchCreateCombinationElementsStub,
          [{ treatmentId: 3, testData: '3_2' }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchCreateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchCreateTreatmentsStub,
          request.adds,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        // Combination elements created through treatment add
        sinon.assert.calledWithExactly(
          batchCreateCombinationElementsStub,
          [{ treatmentId: 1 }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
      })
    })

    it('returns rejected promise when add treatment fails', () => {
      const request = {
        adds: [{ combinationElements: [{}] }],
        updates: [
          {
            id: 3,
            combinationElements: [  // loses combination element with ID 4
              {
                id: 5,
                testData: '3_1',
              },
              {
                testData: '3_2',
              },
            ],
          },
        ],
        deletes: [6],
      }

      batchDeleteTreatmentsStub.resolves()
      batchUpdateTreatmentsStub.resolves()
      batchGetCombinationElementsByTreatmentIdStub.withArgs([3]).resolves([[{ id: 4 }, { id: 5 }]])
      batchDeleteCombinationElementsStub.resolves()
      batchUpdateCombinationElementsStub.resolves()
      batchCreateTreatmentsStub.rejects(testError)

      return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)

        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [6],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          request.updates,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchGetCombinationElementsByTreatmentIdStub)
        sinon.assert.calledWithExactly(
          batchGetCombinationElementsByTreatmentIdStub,
          [3],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchDeleteCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchDeleteCombinationElementsStub,
          [4],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchUpdateCombinationElementsStub,
          [{ id: 5, testData: '3_1', treatmentId: 3 }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchCreateCombinationElementsStub)
        // Combination elements created through treatment update
        sinon.assert.calledWithExactly(
          batchCreateCombinationElementsStub,
          [{ treatmentId: 3, testData: '3_2' }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchCreateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchCreateTreatmentsStub,
          request.adds,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )
      })
    })

    it('returns rejected promise when add combination element fails', () => {
      const request = {
        adds: [{ combinationElements: [{}] }],
        updates: [
          {
            id: 3,
            combinationElements: [  // loses combination element with ID 4
              {
                id: 5,
                testData: '3_1',
              },
              {
                testData: '3_2',
              },
            ],
          },
        ],
        deletes: [6],
      }

      batchDeleteTreatmentsStub.resolves()
      batchUpdateTreatmentsStub.resolves()
      batchGetCombinationElementsByTreatmentIdStub.withArgs([3]).resolves([[{ id: 4 }, { id: 5 }]])
      batchDeleteCombinationElementsStub.resolves()
      batchUpdateCombinationElementsStub.resolves()
      batchCreateCombinationElementsStub.rejects(testError)

      return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)

        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [6],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          request.updates,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchGetCombinationElementsByTreatmentIdStub)
        sinon.assert.calledWithExactly(
          batchGetCombinationElementsByTreatmentIdStub,
          [3],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchDeleteCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchDeleteCombinationElementsStub,
          [4],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchUpdateCombinationElementsStub,
          [{ id: 5, testData: '3_1', treatmentId: 3 }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchCreateCombinationElementsStub)
        // Combination elements created through treatment update
        sinon.assert.calledWithExactly(
          batchCreateCombinationElementsStub,
          [{ treatmentId: 3, testData: '3_2' }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.notCalled(batchCreateTreatmentsStub)
      })
    })

    it('returns rejected promise when update treatments fails', () => {
      const request = {
        adds: [{ combinationElements: [{}] }],
        updates: [
          {
            id: 3,
            combinationElements: [  // loses combination element with ID 4
              {
                id: 5,
                testData: '3_1',
              },
              {
                testData: '3_2',
              },
            ],
          },
        ],
        deletes: [6],
      }

      batchDeleteTreatmentsStub.resolves()
      batchUpdateTreatmentsStub.rejects(testError)

      return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)

        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [6],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          request.updates,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.notCalled(batchGetCombinationElementsByTreatmentIdStub)

        sinon.assert.notCalled(batchDeleteCombinationElementsStub)

        sinon.assert.notCalled(batchUpdateCombinationElementsStub)

        sinon.assert.notCalled(batchCreateCombinationElementsStub)

        sinon.assert.notCalled(batchCreateTreatmentsStub)
      })
    })

    it('returns rejected promise when update combination elements fails', () => {
      const request = {
        adds: [{ combinationElements: [{}] }],
        updates: [
          {
            id: 3,
            combinationElements: [  // loses combination element with ID 4
              {
                id: 5,
                testData: '3_1',
              },
              {
                testData: '3_2',
              },
            ],
          },
        ],
        deletes: [6],
      }

      batchDeleteTreatmentsStub.resolves()
      batchUpdateTreatmentsStub.resolves()
      batchGetCombinationElementsByTreatmentIdStub.withArgs([3]).resolves([[{ id: 4 }, { id: 5 }]])
      batchDeleteCombinationElementsStub.resolves()
      batchUpdateCombinationElementsStub.rejects(testError)

      return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)

        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [6],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          request.updates,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchGetCombinationElementsByTreatmentIdStub)
        sinon.assert.calledWithExactly(
          batchGetCombinationElementsByTreatmentIdStub,
          [3],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchDeleteCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchDeleteCombinationElementsStub,
          [4],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchUpdateCombinationElementsStub,
          [{ id: 5, testData: '3_1', treatmentId: 3 }],
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.notCalled(batchCreateCombinationElementsStub)

        sinon.assert.notCalled(batchCreateTreatmentsStub)
      })
    })

    it('returns rejected promise when getting combination elements for treatment fails', () => {
      const request = {
        adds: [{ combinationElements: [{}] }],
        updates: [
          {
            id: 3,
            combinationElements: [  // loses combination element with ID 4
              {
                id: 5,
                testData: '3_1',
              },
              {
                testData: '3_2',
              },
            ],
          },
        ],
        deletes: [6],
      }

      batchDeleteTreatmentsStub.resolves()
      batchUpdateTreatmentsStub.resolves()
      batchGetCombinationElementsByTreatmentIdStub.withArgs([3]).rejects(testError)

      return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)

        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [6],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          request.updates,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchGetCombinationElementsByTreatmentIdStub)
        sinon.assert.calledWithExactly(
          batchGetCombinationElementsByTreatmentIdStub,
          [3],
          sinon.match.same(testTx),
        )

        sinon.assert.notCalled(batchDeleteCombinationElementsStub)

        sinon.assert.notCalled(batchUpdateCombinationElementsStub)

        sinon.assert.notCalled(batchCreateCombinationElementsStub)

        sinon.assert.notCalled(batchCreateTreatmentsStub)
      })
    })

    it('returns rejected promise when delete treatment fails', () => {
      const request = {
        adds: [{ combinationElements: [{}] }],
        updates: [
          {
            id: 3,
            combinationElements: [  // loses combination element with ID 4
              {
                id: 5,
                testData: '3_1',
              },
              {
                testData: '3_2',
              },
            ],
          },
        ],
        deletes: [6],
      }

      batchDeleteTreatmentsStub.rejects(testError)

      return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)

        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [6],
          sinon.match.same(testTx),
        )
        sinon.assert.notCalled(batchDeleteCombinationElementsStub)
        sinon.assert.notCalled(batchCreateTreatmentsStub)
        sinon.assert.notCalled(batchCreateCombinationElementsStub)
        sinon.assert.notCalled(batchUpdateTreatmentsStub)
        sinon.assert.notCalled(batchUpdateCombinationElementsStub)
        sinon.assert.notCalled(batchGetCombinationElementsByTreatmentIdStub)
      })
    })

    it('returns rejected promise when deleting combination elements fails', () => {
      const request = {
        adds: [{ combinationElements: [{}] }],
        updates: [
          {
            id: 3,
            combinationElements: [  // loses combination element with ID 4
              {
                id: 5,
                testData: '3_1',
              },
              {
                testData: '3_2',
              },
            ],
          },
        ],
        deletes: [6],
      }

      batchDeleteTreatmentsStub.resolves()
      batchUpdateTreatmentsStub.resolves()
      batchGetCombinationElementsByTreatmentIdStub.withArgs([3]).resolves([[{ id: 4 }, { id: 5 }]])
      batchDeleteCombinationElementsStub.rejects(testError)

      return target.manageAllTreatmentDetails(request, testContext, testTx).should.be.rejected.then((err) => {
        err.should.equal(testError)

        sinon.assert.calledOnce(batchDeleteTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchDeleteTreatmentsStub,
          [6],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchUpdateTreatmentsStub)
        sinon.assert.calledWithExactly(
          batchUpdateTreatmentsStub,
          request.updates,
          sinon.match.same(testContext),
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchGetCombinationElementsByTreatmentIdStub)
        sinon.assert.calledWithExactly(
          batchGetCombinationElementsByTreatmentIdStub,
          [3],
          sinon.match.same(testTx),
        )

        sinon.assert.calledOnce(batchDeleteCombinationElementsStub)
        sinon.assert.calledWithExactly(
          batchDeleteCombinationElementsStub,
          [4],
          sinon.match.same(testTx),
        )

        sinon.assert.notCalled(batchUpdateCombinationElementsStub)

        sinon.assert.notCalled(batchCreateCombinationElementsStub)

        sinon.assert.notCalled(batchCreateTreatmentsStub)
      })
    })
  })
})