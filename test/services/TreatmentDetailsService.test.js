import { mock, mockReject, mockResolve } from '../jestUtil'
import TreatmentDetailsService from '../../src/services/TreatmentDetailsService'
import FactorLevelService from '../../src/services/FactorLevelService'
import AppUtil from '../../src/services/utility/AppUtil'

describe('TreatmentDetailsService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  let getFactorLevelsByExperimentIdNoExistenceCheckOriginal

  beforeEach(() => {
    target = new TreatmentDetailsService()

    getFactorLevelsByExperimentIdNoExistenceCheckOriginal = FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck
  })

  afterEach(() => {
    FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = getFactorLevelsByExperimentIdNoExistenceCheckOriginal
  })

  describe('getAllTreatmentDetails', () => {
    it('returns treatments with combination elements', () => {
      const treatments = [{ id: 1, treatment_number: 1, }]
      const combinationElements = [{treatment_id: 1, id: 1, factor_level_id: 1, }, {treatment_id:1, id: 2, factor_level_id: 2}]
      const factorLevels = [{id: 1, factor_id: 1, value: { items: [] }, }, {id: 2, factor_id: 2}]
      const factors = [{id: 1, name: 'test', }, {id: 2, name: 'test2'}]

      const expectedData = [
        {
          id: 1,
          is_control: undefined,
          notes: undefined,
          treatment_number: 1,
          combination_elements: [
            {
              id: 1,
              factor_id: 1,
              factor_name: 'test',
              factor_level: {
                id: 1,
                items: [],
              },
            },
            {
              id: 2,
              factor_id: 2,
              factor_name: 'test2',
              factor_level: {
                id: 2,
                items: [],
              }
            }
          ]
        }
      ]

      target.treatmentService.getTreatmentsByExperimentId = mockResolve(treatments)
      target.combinationElementService.getCombinationElementsByExperimentId = mockResolve(combinationElements)
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve(factorLevels)
      target.factorService.getFactorsByExperimentId = mockResolve(factors)

      return target.getAllTreatmentDetails(1,false, testTx).then((data) => {
        expect(target.treatmentService.getTreatmentsByExperimentId).toHaveBeenCalledWith(1,false, testTx)
        expect(target.combinationElementService.getCombinationElementsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.getFactorsByExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(data).toEqual(expectedData)
      })
    })

    it('rejects when it fails to get treatments', () => {
      target.treatmentService.getTreatmentsByExperimentId = mockReject('error')
      target.combinationElementService.getCombinationElementsByExperimentId = mockResolve()
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve()
      target.factorService.getFactorsByExperimentId = mockResolve()

      return target.getAllTreatmentDetails(1,false,testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentsByExperimentId).toHaveBeenCalledWith(1,false, testTx)
        expect(target.combinationElementService.getCombinationElementsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.getFactorsByExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when it fails to get combinationElements', () => {
      target.treatmentService.getTreatmentsByExperimentId = mockResolve()
      target.combinationElementService.getCombinationElementsByExperimentId = mockReject('error')
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve()
      target.factorService.getFactorsByExperimentId = mockResolve()

      return target.getAllTreatmentDetails(1,false,testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentsByExperimentId).toHaveBeenCalledWith(1,false, testTx)
        expect(target.combinationElementService.getCombinationElementsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.getFactorsByExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when it fails to get factorLevels', () => {
      target.treatmentService.getTreatmentsByExperimentId = mockResolve()
      target.combinationElementService.getCombinationElementsByExperimentId = mockResolve()
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockReject('error')
      target.factorService.getFactorsByExperimentId = mockResolve()

      return target.getAllTreatmentDetails(1,false,testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentsByExperimentId).toHaveBeenCalledWith(1,false, testTx)
        expect(target.combinationElementService.getCombinationElementsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.getFactorsByExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when it fails to get factors', () => {
      target.treatmentService.getTreatmentsByExperimentId = mockResolve()
      target.combinationElementService.getCombinationElementsByExperimentId = mockResolve()
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck = mockResolve()
      target.factorService.getFactorsByExperimentId = mockReject('error')

      return target.getAllTreatmentDetails(1,false,testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentsByExperimentId).toHaveBeenCalledWith(1,false, testTx)
        expect(target.combinationElementService.getCombinationElementsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck).toHaveBeenCalledWith(1, testTx)
        expect(target.factorService.getFactorsByExperimentId).toHaveBeenCalledWith(1, false, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('manageAllTreatmentDetails', () => {
    it('calls delete, update, create, and returns composite response', () => {
      target.securityService.permissionsCheck = mockResolve()

      target.deleteTreatments = mockResolve()
      target.updateTreatments = mockResolve()
      target.createTreatments = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllTreatmentDetails(1,{
        deletes: [1],
        updates: [{id:10, value:20}],
        adds: [{value:30}, {value:40}],
      }, testContext, false, testTx).then(() => {
        expect(target.deleteTreatments).toHaveBeenCalledWith([1], {}, testTx)
        expect(target.updateTreatments).toHaveBeenCalledWith([{"experimentId": 1, "id": 10, value:20}], testContext, testTx)
        expect(target.createTreatments).toHaveBeenCalledWith([{"experimentId": 1,value:30},{ "experimentId": 1, value:40}], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    it('rejects when create fails', () => {

      target.securityService.permissionsCheck = mockResolve()
      target.deleteTreatments = mockResolve()
      target.updateTreatments = mockResolve()
      target.createTreatments = mockReject('error')

      return target.manageAllTreatmentDetails(-1, {
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.deleteTreatments).toHaveBeenCalledWith([1], {}, testTx)
        expect(target.updateTreatments).toHaveBeenCalledWith([{experimentId:-1}], testContext, testTx)
        expect(target.createTreatments).toHaveBeenCalledWith([{"experimentId": -1}, {"experimentId": -1}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when update fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.deleteTreatments = mockResolve()
      target.updateTreatments = mockReject('error')
      target.createTreatments = mockReject('error')

      return target.manageAllTreatmentDetails(-1, {
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.deleteTreatments).toHaveBeenCalledWith([1], {}, testTx)
        expect(target.updateTreatments).toHaveBeenCalledWith([{experimentId: -1}], testContext, testTx)
        expect(target.createTreatments).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when delete fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.deleteTreatments = mockReject('error')
      target.updateTreatments = mockReject('error')
      target.createTreatments = mockReject('error')

      return target.manageAllTreatmentDetails(-1, {
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.deleteTreatments).toHaveBeenCalledWith([1], {}, testTx)
        expect(target.updateTreatments).not.toHaveBeenCalled()
        expect(target.createTreatments).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('populateExperimentId', () => {

    it('populates experimentId as a number', () => {
      const treatments = [{ id: 1 }, { id: 2 }]
      TreatmentDetailsService.populateExperimentId(treatments, '-1')
      expect(treatments).toEqual([{ id: 1, experimentId: -1 }, { id: 2, experimentId: -1 }])
    })

  })

  describe('deleteTreatments', () => {
    it('deletes treatments', () => {
      target.treatmentService.batchDeleteTreatments = mockResolve([1])

      return target.deleteTreatments([1], {}, testTx).then((data) => {
        expect(target.treatmentService.batchDeleteTreatments).toHaveBeenCalledWith([1], {}, testTx)
        expect(data).toEqual([1])
      })
    })

    it('rejects when batchDelete fails', () => {
      target.treatmentService.batchDeleteTreatments = mockReject('error')

      return target.deleteTreatments([1], {}, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchDeleteTreatments).toHaveBeenCalledWith([1], {}, testTx)
        expect(err).toEqual('error')
      })
    })

    it('resolves without calling delete when no ids are passed in', () => {
      target.treatmentService.batchDeleteTreatments = mock()

      return target.deleteTreatments([], testTx).then(() => {
        expect(target.treatmentService.batchDeleteTreatments).not.toHaveBeenCalled()
      })
    })
  })

  describe('createTreatments', () => {
    it('returns without creating treatments if none are given', () => {
      target.treatmentService.batchCreateTreatments = mock()

      return target.createTreatments([], testContext, testTx).then(() => {
        expect(target.treatmentService.batchCreateTreatments).not.toHaveBeenCalled()
      })
    })

    it('calls batchCreateTreatments, createCombinationElements, and' +
      ' assembleBatchCreateCombincationElementsRequestFromAdds', () => {
      target.treatmentService.batchCreateTreatments = mockResolve([{ id: 1 }])
      target.createCombinationElements = mockResolve()
      target.assembleBatchCreateCombinationElementsRequestFromAdds = mock([{}])

      return target.createTreatments([{id:1, experimentId:10}], testContext, testTx).then(() => {
        expect(target.treatmentService.batchCreateTreatments).toHaveBeenCalledWith([{id:1, experimentId:10}], testContext, testTx)
        expect(target.createCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.assembleBatchCreateCombinationElementsRequestFromAdds).toHaveBeenCalledWith([{id:1, experimentId:10}], [1])
      })
    })

    it('rejects when createCombinationElements fails', () => {
      target.securityService.permissionsCheckForExperiments = mockResolve()
      target.treatmentService.batchCreateTreatments = mockResolve([{ id: 1 }])
      target.createCombinationElements = mockReject('error')
      target.assembleBatchCreateCombinationElementsRequestFromAdds = mock([{}])

      return target.createTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchCreateTreatments).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.assembleBatchCreateCombinationElementsRequestFromAdds).toHaveBeenCalledWith([{}], [1])
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreateTreatments fails', () => {
      target.securityService.permissionsCheckForExperiments = mockResolve()
      target.treatmentService.batchCreateTreatments = mockReject('error')
      target.createCombinationElements = mockReject('error')
      target.assembleBatchCreateCombinationElementsRequestFromAdds = mock([{}])

      return target.createTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchCreateTreatments).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createCombinationElements).not.toHaveBeenCalled()
        expect(target.assembleBatchCreateCombinationElementsRequestFromAdds).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('assembleBatchCreateCombinationElementsRequestFromAdds', () => {
    it('calls adds treatmentId to combination elements and removes undefined elements', () => {
      const treatments = [{ combinationElements: [{}] }, {}]
      const result = target.assembleBatchCreateCombinationElementsRequestFromAdds(treatments, [1, 2])
      expect(result).toEqual([{ treatmentId: 1 }])
    })
  })

  describe('appendParentTreatmentIdsToCombinationElements', () => {
    it('adds treatment id to combination elements if they are present', () => {
      const treatments = [{ combinationElements: [{}] }, {}]

      target.appendParentTreatmentIdsToCombinationElements(treatments, [1, 2])
      expect(treatments[0].combinationElements).toEqual([{ treatmentId: 1 }])
      expect(treatments[1].combinationElements).toEqual(undefined)
    })
  })

  describe('extractCombinationElementsFromTreatments', () => {
    it('gets all combination elements, or undefined if they are not present', () => {
      const treatments = [{ combinationElements: [{}] }, {}]

      expect(target.extractCombinationElementsFromTreatments(treatments)).toEqual([{}, undefined])
    })
  })

  describe('removeUndefinedElements', () => {
    it('removes undefined values from combination elements array', () => {
      const elements = [{}, undefined]

      expect(target.removeUndefinedElements(elements)).toEqual([{}])
    })
  })

  describe('updateTreatments', () => {
    it('does not update anything when no treatments are given', () => {
      target.treatmentService.batchUpdateTreatments = mock()

      return target.updateTreatments([], testContext, testTx).then(() => {
        expect(target.treatmentService.batchUpdateTreatments).not.toHaveBeenCalled()
      })
    })

    it('updates treatments, deletes, and creates combination elements', () => {

      target.treatmentService.batchUpdateTreatments = mockResolve()
      target.deleteCombinationElements = mockResolve()
      target.createAndUpdateCombinationElements = mockResolve()

      return target.updateTreatments([{}], testContext, testTx).then(() => {
        expect(target.treatmentService.batchUpdateTreatments).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.deleteCombinationElements).toHaveBeenCalledWith([{}], {}, testTx)
        expect(target.createAndUpdateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
      })
    })

    it('rejects when createAndUpdateCombinationElements fails', () => {
      target.treatmentService.batchUpdateTreatments = mockResolve()
      target.deleteCombinationElements = mockResolve()
      target.createAndUpdateCombinationElements = mockReject('error')

      return target.updateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchUpdateTreatments).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.deleteCombinationElements).toHaveBeenCalledWith([{}], {}, testTx)
        expect(target.createAndUpdateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when deleteCombinationElements fails', () => {
      target.treatmentService.batchUpdateTreatments = mockResolve()
      target.deleteCombinationElements = mockReject('error')
      target.createAndUpdateCombinationElements = mockReject('error')

      return target.updateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchUpdateTreatments).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.deleteCombinationElements).toHaveBeenCalledWith([{}], {}, testTx)
        expect(target.createAndUpdateCombinationElements).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchUpdateTreatments fails', () => {
      target.treatmentService.batchUpdateTreatments = mockReject('error')
      target.deleteCombinationElements = mockReject('error')
      target.createAndUpdateCombinationElements = mockReject('error')

      return target.updateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchUpdateTreatments).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.deleteCombinationElements).not.toHaveBeenCalled()
        expect(target.createAndUpdateCombinationElements).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteCombinationElements', () => {
    it('does not delete any combination elements when there are none to delete', () => {
      target.identifyCombinationElementIdsForDelete = mockResolve([])
      target.combinationElementService.batchDeleteCombinationElements = mock()

      return target.deleteCombinationElements([{}], {}, testTx).then(() => {
        expect(target.identifyCombinationElementIdsForDelete).toHaveBeenCalledWith([{}], {}, testTx)
        expect(target.combinationElementService.batchDeleteCombinationElements).not.toHaveBeenCalled()
      })
    })

    it('deletes combination elements', () => {
      target.identifyCombinationElementIdsForDelete = mockResolve([1])
      target.combinationElementService.batchDeleteCombinationElements = mockResolve([1])

      return target.deleteCombinationElements([{}], {}, testTx).then((data) => {
        expect(target.identifyCombinationElementIdsForDelete).toHaveBeenCalledWith([{}], {}, testTx)
        expect(target.combinationElementService.batchDeleteCombinationElements).toHaveBeenCalledWith([1], {}, testTx)
        expect(data).toEqual([1])
      })
    })

    it('rejects when delete fails', () => {
      target.identifyCombinationElementIdsForDelete = mockResolve([1])
      target.combinationElementService.batchDeleteCombinationElements = mockReject('error')

      return target.deleteCombinationElements([{}], {}, testTx).then(() => {}, (err) => {
        expect(target.identifyCombinationElementIdsForDelete).toHaveBeenCalledWith([{}], {}, testTx)
        expect(target.combinationElementService.batchDeleteCombinationElements).toHaveBeenCalledWith([1], {}, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when identifyCombinationElementIdsForDelete fails', () => {
      target.identifyCombinationElementIdsForDelete = mockReject('error')
      target.combinationElementService.batchDeleteCombinationElements = mockReject('error')

      return target.deleteCombinationElements([{}], {}, testTx).then(() => {}, (err) => {
        expect(target.identifyCombinationElementIdsForDelete).toHaveBeenCalledWith([{}], {}, testTx)
        expect(target.combinationElementService.batchDeleteCombinationElements).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('identifyCombinationElementIdsForDelete', () => {
    it('returns ids that are no longer associated to treatments', () => {
      const oldElements = [[{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]]
      const treatments = [{ id: 1, combinationElements: [{ id: 1 }, { id: 3 }] }]
      target.combinationElementService.batchGetCombinationElementsByTreatmentIds = mockResolve(oldElements)

      return target.identifyCombinationElementIdsForDelete(treatments, {}, testTx).then((data) => {
        expect(target.combinationElementService.batchGetCombinationElementsByTreatmentIds).toHaveBeenCalledWith([1], {}, testTx)
        expect(data).toEqual([2, 4])
      })
    })

    it('returns no elements when they all match', () => {
      const oldElements = [[{ id: 1 }, { id: 3 }]]
      const treatments = [{ id: 1, combinationElements: [{ id: 1 }, { id: 3 }] }]
      target.combinationElementService.batchGetCombinationElementsByTreatmentIds = mockResolve(oldElements)

      return target.identifyCombinationElementIdsForDelete(treatments, {}, testTx).then((data) => {
        expect(target.combinationElementService.batchGetCombinationElementsByTreatmentIds).toHaveBeenCalledWith([1], {}, testTx)
        expect(data).toEqual([])
      })
    })

    it('rejects when batchGetCombinationElementsByTreatmentIds fails', () => {
      const treatments = [{ id: 1, combinationElements: [{ id: 1 }, { id: 3 }] }]
      target.combinationElementService.batchGetCombinationElementsByTreatmentIds = mockReject('error')

      return target.identifyCombinationElementIdsForDelete(treatments, {}, testTx).then(() => {}, (err) => {
        expect(target.combinationElementService.batchGetCombinationElementsByTreatmentIds).toHaveBeenCalledWith([1], {}, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('createAndUpdateCombinationElements', () => {
    it('updates and creates combination elements', () => {
      target.updateCombinationElements = mockResolve()
      target.createCombinationElements = mockResolve()
      target.assembleBatchUpdateCombinationElementsRequestFromUpdates = mock([{}])
      target.assembleBatchCreateCombinationElementsRequestFromUpdates = mock([{}])

      return target.createAndUpdateCombinationElements([{}], testContext, testTx).then(() => {
        expect(target.updateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.assembleBatchUpdateCombinationElementsRequestFromUpdates).toHaveBeenCalledWith([{}])
        expect(target.assembleBatchCreateCombinationElementsRequestFromUpdates).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when createCombinationElements fails', () => {
      target.updateCombinationElements = mockResolve()
      target.createCombinationElements = mockReject('error')
      target.assembleBatchUpdateCombinationElementsRequestFromUpdates = mock([{}])
      target.assembleBatchCreateCombinationElementsRequestFromUpdates = mock([{}])

      return target.createAndUpdateCombinationElements([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.updateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.assembleBatchUpdateCombinationElementsRequestFromUpdates).toHaveBeenCalledWith([{}])
        expect(target.assembleBatchCreateCombinationElementsRequestFromUpdates).toHaveBeenCalledWith([{}])
        expect(err).toEqual('error')
      })
    })

    it('rejects when updateCombinationElements fails', () => {
      target.updateCombinationElements = mockReject('error')
      target.createCombinationElements = mockReject('error')
      target.assembleBatchUpdateCombinationElementsRequestFromUpdates = mock([{}])
      target.assembleBatchCreateCombinationElementsRequestFromUpdates = mock([{}])

      return target.createAndUpdateCombinationElements([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.updateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createCombinationElements).not.toHaveBeenCalled()
        expect(target.assembleBatchUpdateCombinationElementsRequestFromUpdates).toHaveBeenCalledWith([{}])
        expect(target.assembleBatchCreateCombinationElementsRequestFromUpdates).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('assembleBatchCreateCombinationElementsRequestFromUpdates', () => {
    it('sets treatment id on new elements and returns them', () => {
      const treatments = [{id: 1, combinationElements: [{id: 1},{}]}]

      const result = target.assembleBatchCreateCombinationElementsRequestFromUpdates(treatments)
      expect(result).toEqual([{treatmentId: 1}])
    })

    it('sets treatment id on new combination elements, and returns them for multiple treatments', () => {
      const treatments = [{id: 1, combinationElements: [{id: 1},{}]},{id: 2, combinationElements: [{}]}]

      const result = target.assembleBatchCreateCombinationElementsRequestFromUpdates(treatments)
      expect(result).toEqual([{treatmentId: 1},{treatmentId: 2}])
    })
  })

  describe('assembleBatchUpdateCombinationElementsRequestFromUpdates', () => {
    it('sets treatment id on existing elements and returns them', () => {
      const treatments = [{id: 1, combinationElements: [{id: 1},{}]}]

      const result = target.assembleBatchUpdateCombinationElementsRequestFromUpdates(treatments)
      expect(result).toEqual([{id: 1, treatmentId: 1}])
    })

    it('sets treatment id on new combination elements, and returns them for multiple treatments', () => {
      const treatments = [{id: 1, combinationElements: [{id: 1},{}]},{id: 2, combinationElements: [{id: 4}]}]

      const result = target.assembleBatchUpdateCombinationElementsRequestFromUpdates(treatments)
      expect(result).toEqual([{id: 1, treatmentId: 1},{id: 4, treatmentId: 2}])
    })
  })

  describe('createCombinationElements', () => {
    it('does not create elements if none are passed in', () => {
      target.combinationElementService.batchCreateCombinationElements = mock()

      return target.createCombinationElements([], testContext, testTx).then(() => {
        expect(target.combinationElementService.batchCreateCombinationElements).not.toHaveBeenCalled()
      })
    })

    it('creates combination elements', () => {
      target.combinationElementService.batchCreateCombinationElements = mockResolve([{}])

      return target.createCombinationElements([{}], testContext, testTx).then((data) => {
        expect(target.combinationElementService.batchCreateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when batchCreateCombinationElements fails', () => {
      target.combinationElementService.batchCreateCombinationElements = mockReject('error')

      return target.createCombinationElements([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.combinationElementService.batchCreateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('updateCombinationElements', () => {
    it('does not update any elements when none are passed in', () => {
      target.combinationElementService.batchUpdateCombinationElements = mock()

      return target.updateCombinationElements([], testContext, testTx).then(() => {
        expect(target.combinationElementService.batchUpdateCombinationElements).not.toHaveBeenCalled()
      })
    })

    it('updates combination elements', () => {
      target.combinationElementService.batchUpdateCombinationElements = mockResolve([{}])

      return target.updateCombinationElements([{}], testContext, testTx).then((data) => {
        expect(target.combinationElementService.batchUpdateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when batchUpdateCombinationElements fails', () => {
      target.combinationElementService.batchUpdateCombinationElements = mockReject('error')

      return target.updateCombinationElements([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.combinationElementService.batchUpdateCombinationElements).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })
  })
})