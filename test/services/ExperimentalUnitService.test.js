import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentalUnitService from '../../src/services/ExperimentalUnitService'
import { dbRead, dbWrite } from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import QuestionsUtil from '../../src/services/utility/QuestionsUtil'
import KafkaProducer from '../../src/services/kafka/KafkaProducer'
import kafkaConfig from '../configs/kafkaConfig'

describe('ExperimentalUnitService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  const trimmedUnit = {
    block: '1',
    blockId: 1,
    createdDate: '2019-08-19T16:10:03.353Z',
    createdUserId: 'user',
    deactivationReason: 'damage',
    id: 9295665,
    location: 1,
    modifiedDate: '2019-08-19T18:17:35.289Z',
    modifiedUserId: 'migration',
    rep: 2,
    setEntryId: 124,
    treatmentId: 180490,
  }

  beforeEach(() => {
    target = new ExperimentalUnitService()
  })

  describe('getExperimentalUnitsByExperimentIdNoValidate', () => {
    test('calls findAllByExperimentId', () => {
      dbRead.unit.findAllByExperimentId = mockResolve()

      return target.getExperimentalUnitsByExperimentIdNoValidate(1).then(() => {
        expect(dbRead.unit.findAllByExperimentId).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('getExperimentalUnitInfoBySetId', () => {
    let originalMap

    beforeAll(() => {
      originalMap = target.mapUnitsToSetEntryFormat
    })

    test('throws an error when setId is undefined', () => {
      AppError.badRequest = mock('')

      expect(() => target.getExperimentalUnitInfoBySetId()).toThrow()
      expect(AppError.badRequest).toBeCalledWith('A setId is required')
    })

    test('throws an error when no results found', (done) => {
      dbRead.unit.batchFindAllBySetId = mockResolve([])
      AppError.notFound = mock('')

      return target.getExperimentalUnitInfoBySetId(5).catch(() => {
        expect(AppError.notFound).toBeCalledWith('Either the set was not found or no set entries are associated with the set.', undefined, '179001')
        done()
      })
    })

    test('returns the result from the map function when data found', () => {
      const mockResult = { 1: {} }
      const repoResult = [{ set_entry_id: 1 }]
      dbRead.unit.batchFindAllBySetId = mockResolve(repoResult)
      target.mapUnitsToSetEntryFormat = mock(mockResult)

      return target.getExperimentalUnitInfoBySetId(5).then((result) => {
        expect(target.mapUnitsToSetEntryFormat).toBeCalledWith(repoResult)
        expect(result).toEqual(mockResult)
      })
    })

    afterAll(() => {
      target.mapUnitsToSetEntryFormat = originalMap
    })
  })

  describe('getExperimentalUnitInfoBySetEntryId', () => {
    let originalMap

    beforeAll(() => {
      originalMap = target.mapUnitsToSetEntryFormat
    })

    test('throws an error when setEntryIds are not defined', () => {
      dbRead.unit.batchFindAllBySetEntryIds = mock()
      AppError.badRequest = mock('')

      expect(() => target.getExperimentalUnitInfoBySetEntryId()).toThrow()
    })

    test('returns an empty map of Set Entry Ids', () => {
      const result = []
      const expectedMap = {}
      dbRead.unit.batchFindAllBySetEntryIds = mockResolve(result)
      target.mapUnitsToSetEntryFormat = mock(expectedMap)

      return target.getExperimentalUnitInfoBySetEntryId([1]).then((data) => {
        expect(target.mapUnitsToSetEntryFormat).toBeCalledWith(result)
        expect(data).toEqual(expectedMap)
      })
    })

    afterAll(() => {
      target.mapUnitsToSetEntryFormat = originalMap
    })
  })

  describe('mapUnitsToSetEntryFormat', () => {
    test('returns an empty object when given an empty array', () => {
      const result = target.mapUnitsToSetEntryFormat([])

      expect(result).toEqual({})
    })

    test('returns a properly structure object when given a populated array', () => {
      const data = [
        {
          set_entry_id: 1,
          treatment_id: 1,
          treatment_number: 1,
          rep: 1,
        },
      ]
      const expectedMap = {
        1: {
          treatmentId: 1,
          treatmentNumber: 1,
          rep: 1,
        },
      }

      const result = target.mapUnitsToSetEntryFormat(data)

      expect(result).toEqual(expectedMap)
    })
  })

  describe('batchPartialUpdateExperimentalUnits', () => {
    test('calls validate, batchUpdate, and createPutResponse', () => {
      target.validator.validate = mockResolve()
      dbWrite.unit.batchPartialUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchPartialUpdateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PATCH')
        expect(dbWrite.unit.batchPartialUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.unit.batchPartialUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchPartialUpdateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PATCH')
        expect(dbWrite.unit.batchPartialUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.unit.batchPartialUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchPartialUpdateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PATCH')
        expect(dbWrite.unit.batchPartialUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('uniqueIdsCheck', () => {
    test('throws an error when duplicate id(s) are passed in', () => {
      AppError.badRequest = mock('')
      expect(() => ExperimentalUnitService.uniqueIdsCheck([{ id: 1, setEntryId: 1 }, {
        id: 1,
        setEntryId: 2,
      }], 'id')).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Duplicate id(s) in request payload', undefined, '173001')
    })

    test('throws an error when duplicate setEntryId(s) are passed in', () => {
      AppError.badRequest = mock('')
      expect(() => ExperimentalUnitService.uniqueIdsCheck([{ setEntryId: 1 }, { setEntryId: 1 }], 'setEntryId')).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Duplicate setEntryId(s) in request payload', undefined, '173001')
    })

    test('Does not throw an error when no duplicate id found', () => {
      AppError.badRequest = mock('')
      ExperimentalUnitService.uniqueIdsCheck([{ id: 1, setEntryId: 1 }, {
        id: 2,
        setEntryId: 2,
      }], 'id')
      expect(AppError.badRequest).not.toHaveBeenCalled()
    })

    test('Does not throw an error when empty array is passed in', () => {
      AppError.badRequest = mock('')
      ExperimentalUnitService.uniqueIdsCheck([], 'id')
      expect(AppError.badRequest).not.toHaveBeenCalled()
    })
  })

  describe('updateUnitsForSet', () => {
    test('returns an error if the set is not found', () => {
      target = new ExperimentalUnitService()
      target.locationAssociationService.getBySetId = mockResolve()
      dbRead.combinationElement.findAllByExperimentIdIncludingControls = mockResolve()
      const testError = { message: 'error' }
      AppError.notFound = mock(testError)

      return target.updateUnitsForSet(5, [], {}, testTx).catch((err) => {
        expect(target.locationAssociationService.getBySetId).toBeCalledWith(5)
        expect(AppError.notFound).toBeCalledWith('No experiment found for Set Id 5', undefined, '17F001')
        expect(err).toBe(testError)
        expect(dbRead.combinationElement.findAllByExperimentIdIncludingControls).not.toBeCalled()
      })
    })

    test('saves units to database if they all have treatments in the correct block', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19 },
      ]
      target = new ExperimentalUnitService()
      target.locationAssociationService.getBySetId = mockResolve({ experiment_id: 7, location: 1, block_id: 3 })
      dbRead.designSpecificationDetail.getRandomizationStrategyIdByExperimentId = mockResolve({ value: '2' })
      dbRead.experiments.find = mockResolve({ randomization_strategy_code: 'custom-build-on-map' })
      dbRead.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
        { treatment_id: 20 },
      ])
      const treatmentBlocks = [
        { treatment_id: 23, block_id: 3 },
        { treatment_id: 24, block_id: 3 },
        { treatment_id: 25, block_id: 3 },
        { treatment_id: 20, block_id: 3 },
      ]
      dbRead.treatmentBlock.batchFindByBlockIds = mockResolve(treatmentBlocks)
      AppError.notFound = mock()
      AppError.badRequest = mock()
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).then(() => {
        expect(target.locationAssociationService.getBySetId).toBeCalledWith(5)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).not.toBeCalled()
        expect(dbRead.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7)
        expect(dbRead.experiments.find).toBeCalledWith(7, false)
        expect(dbRead.treatmentBlock.batchFindByBlockIds).toBeCalledWith(3)
        expect(target.mergeSetEntriesToUnits).toBeCalledWith(7, [
          { setEntryId: 15, treatmentId: 23 },
          { setEntryId: 17, treatmentId: 24 },
          { setEntryId: 19, treatmentId: 20 },
        ], 1, treatmentBlocks, {}, testTx)
      })
    })

    test('returns an error if a treatment is in the wrong block', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19, factorLevelIds: [] },
      ]
      target = new ExperimentalUnitService()
      target.locationAssociationService.getBySetId = mockResolve({ experiment_id: 7, location: 1, block_id: 5 })
      dbRead.designSpecificationDetail.getRandomizationStrategyIdByExperimentId = mockResolve({ value: '2' })
      dbRead.experiments.find = mockResolve({ randomization_strategy_code: 'custom-build-on-map' })
      dbRead.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
        { treatment_id: 20 },
      ])
      dbRead.treatmentBlock.batchFindByBlockIds = mockResolve([
        { treatment_id: 23, block_id: 5 },
        { treatment_id: 25, block_id: 5 },
        { treatment_id: 20, block_id: 5 },
      ])
      const testError = { message: 'error' }
      AppError.notFound = mock()
      AppError.badRequest = mock(testError)
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).catch((err) => {
        expect(target.locationAssociationService.getBySetId).toBeCalledWith(5)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('One or more entries used a treatment from a block that does not match the set\'s block.', undefined, '17F003')
        expect(dbRead.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7)
        expect(dbRead.experiments.find).toBeCalledWith(7, false)
        expect(dbRead.treatmentBlock.batchFindByBlockIds).toBeCalledWith(5)
        expect(target.mergeSetEntriesToUnits).not.toBeCalled()
        expect(err).toBe(testError)
      })
    })

    test('returns an error if a matching treatment is not found', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19 },
      ]
      const testError = { message: 'error' }
      target = new ExperimentalUnitService()
      target.locationAssociationService.getBySetId = mockResolve({ experiment_id: 7, location: 1, block_id: 3 })
      dbRead.experiments.find = mockResolve({ randomization_strategy_code: 'custom-build-on-map' })
      dbRead.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
      ])
      dbRead.treatmentBlock.batchFindByBlockIds = mockResolve([
        { treatment_id: 23, block_id: 3 },
        { treatment_id: 24, block_id: 3 },
        { treatment_id: 25, block_id: 3 },
      ])
      AppError.notFound = mock()
      AppError.badRequest = mock(testError)
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).catch((err) => {
        expect(target.locationAssociationService.getBySetId).toBeCalledWith(5)
        expect(AppError.notFound).not.toBeCalled()
        expect(dbRead.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7)
        expect(dbRead.experiments.find).toBeCalledWith(7, false)
        expect(dbRead.treatmentBlock.batchFindByBlockIds).not.toBeCalled()
        expect(target.mergeSetEntriesToUnits).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('One or more entries had an invalid combination of factor level ids. The invalid combinations are: [""]', undefined, '17F002')
        expect(err).toBe(testError)
      })
    })

    test('returns an error if the randomization strategy is not custom-build-on-map', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19, factorLevelIds: [] },
      ]
      const testError = { message: 'error' }
      target = new ExperimentalUnitService()
      target.locationAssociationService.getBySetId = mockResolve({ experiment_id: 7, location: 1, block: null })
      dbRead.experiments.find = mockResolve({ randomization_strategy_code: 'custom' })
      dbRead.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
        { treatment_id: 20 },
      ])
      AppError.notFound = mock()
      AppError.badRequest = mock(testError)
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).catch((err) => {
        expect(target.locationAssociationService.getBySetId).toBeCalledWith(5)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('This endpoint only supports sets/experiments with a "Custom - Build on Map" randomization strategy.', undefined, '17F004')
        expect(dbRead.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7)
        expect(dbRead.experiments.find).toBeCalledWith(7, false)
        expect(target.mergeSetEntriesToUnits).not.toBeCalled()
        expect(err).toBe(testError)
      })
    })
  })

  describe('mergeSetEntriesToUnits', () => {
    test('correctly handles the flow', () => {
      target = new ExperimentalUnitService()
      target.getDbActions = mock({
        unitsToBeCreated: 'unitsToBeCreated',
        unitsToBeDeleted: 'unitsToBeDeleted',
        unitsToBeUpdated: 'unitsToBeUpdated',
      })
      target.saveToDb = mockResolve()
      target.detectWarnableUnitUpdateConditions = mock()
      dbRead.unit.batchFindAllByLocationAndTreatmentBlocks = mockResolve('unitsFromDb')
      const unitsToBeSaved = [{}]

      return target.mergeSetEntriesToUnits(7, unitsToBeSaved, 5, [{ id: 3 }, { id: 4 }], {}, testTx).then(() => {
        expect(dbRead.unit.batchFindAllByLocationAndTreatmentBlocks).toBeCalledWith(5, [3, 4])
        expect(target.getDbActions).toBeCalledWith(unitsToBeSaved, 'unitsFromDb', 5)
        expect(target.saveToDb).toBeCalledWith('unitsToBeCreated', 'unitsToBeUpdated', 'unitsToBeDeleted', {}, testTx)
      })
    })
  })

  describe('getDbActions', () => {
    test('correctly categorizes units', () => {
      const unitsFromMessage = [{
        rep: 1,
        setEntryId: 234,
        treatmentBlockId: 7,
      }, {
        rep: 1,
        setEntryId: 235,
        treatmentBlockId: 8,
      }, {
        rep: 1,
        setEntryId: 236,
        treatmentBlockId: 9,
      }, {
        rep: 2,
        setEntryId: 237,
        treatmentBlockId: 7,
      }]
      const unitsFromDb = [{
        id: 55,
        rep: 1,
        setEntryId: 233,
        treatmentBlockId: 8,
        location: 1,
      }, {
        id: 66,
        rep: 1,
        setEntryId: 234,
        treatmentBlockId: 7,
        location: 1,
      }, {
        id: 77,
        rep: 1,
        setEntryId: 235,
        treatmentBlockId: 9,
        location: 1,
      }]

      target = new ExperimentalUnitService()

      const result = target.getDbActions(unitsFromMessage, unitsFromDb, 1)

      expect(result).toEqual({
        unitsToBeCreated: [{
          rep: 1,
          setEntryId: 236,
          treatmentBlockId: 9,
          location: 1,
        }, {
          rep: 2,
          setEntryId: 237,
          treatmentBlockId: 7,
          location: 1,
        }],
        unitsToBeUpdated: [{
          id: 77,
          rep: 1,
          setEntryId: 235,
          treatmentBlockId: 8,
          location: 1,
        }],
        unitsToBeDeleted: [55],
      })
    })
  })

  describe('saveToDb', () => {
    test('calls everything correctly when values are present', () => {
      target = new ExperimentalUnitService()
      const context = { userId: 'REP_PACKING' }
      dbWrite.unit.batchCreate = mockResolve()
      dbWrite.unit.batchUpdate = mockResolve()
      dbWrite.unit.batchRemove = mockResolve()

      return target.saveToDb([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], [{ id: 5 }], [6], context, testTx).then(() => {
        expect(dbWrite.unit.batchCreate).toBeCalledWith([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], context, testTx)
        expect(dbWrite.unit.batchUpdate).toBeCalledWith([{ id: 5 }], context, testTx)
        expect(dbWrite.unit.batchRemove).toBeCalledWith([6], testTx)
      })
    })

    test('calls everything correctly when values are not present', () => {
      target = new ExperimentalUnitService()
      dbWrite.unit.batchCreate = mockResolve()
      dbWrite.unit.batchUpdate = mockResolve()
      dbWrite.unit.batchRemove = mockResolve()

      return target.saveToDb(9, [], [], [], testTx).then(() => {
        expect(dbWrite.unit.batchCreate).not.toBeCalled()
        expect(dbWrite.unit.batchUpdate).not.toBeCalled()
        expect(dbWrite.unit.batchRemove).not.toBeCalled()
      })
    })
  })

  describe('deactivateExperimentalUnits', () => {
    const context = { userId: 'FooBar Baz' }

    beforeEach(() => {
      target = new ExperimentalUnitService()
      target.validateDeactivations = () => Promise.resolve()
    })

    test('it returns deactivated units given valid input', () => {
      const payload = [
        { setEntryId: 1, deactivationReason: 'foo' },
        { id: 2, deactivationReason: 'bar' },
      ]
      const setEntryIdMockReturnValue = [{ set_entry_id: 1, deactivation_reason: null, treatment_block_id: 2 }]
      const unitMockReturnValue = [{
        id: 2, deactivationReason: null, set_entry_id: 7, treatment_block_id: 1,
      }]

      dbRead.unit.batchFindAllBySetEntryIds = mockResolve(setEntryIdMockReturnValue)
      dbRead.unit.batchFindAllByIds = mockResolve(unitMockReturnValue)
      dbWrite.unit.batchUpdateDeactivationReasons = mockResolve()
      target.sendDeactivationNotifications = mock()
      target.sendProd360KafkaNotifications = mockResolve()

      return target.deactivateExperimentalUnits(payload, context, testTx).then(() => {
        expect(dbRead.unit.batchFindAllBySetEntryIds).toHaveBeenCalledTimes(1)
        expect(dbRead.unit.batchFindAllByIds).toHaveBeenCalledTimes(1)
        expect(dbWrite.unit.batchUpdateDeactivationReasons).toHaveBeenCalledTimes(1)
        expect(target.sendProd360KafkaNotifications).toHaveBeenCalledWith([2, 1])
      })
    })

    test('it does not query db by set entry id if no units containing a set entry id are given', () => {
      const payload = [
        { id: 1, deactivationReason: 'foo' },
        { id: 2, deactivationReason: 'bar' },
      ]
      const unitMockReturnValue = [
        {
          id: 1, deactivationReason: null, set_entry_id: 5, treatment_block_id: 2,
        },
        {
          id: 2, deactivationReason: null, set_entry_id: 7, treatment_block_id: 1,
        },
      ]

      dbRead.unit.batchFindAllBySetEntryIds = mockResolve()
      dbRead.unit.batchFindAllByIds = mockResolve(unitMockReturnValue)
      dbWrite.unit.batchUpdateDeactivationReasons = mockResolve()
      target.sendDeactivationNotifications = mock()
      target.sendProd360KafkaNotifications = mockResolve()

      return target.deactivateExperimentalUnits(payload, context, testTx).then(() => {
        expect(dbRead.unit.batchFindAllBySetEntryIds).not.toHaveBeenCalled()
        expect(dbRead.unit.batchFindAllByIds).toHaveBeenCalledTimes(1)
        expect(dbWrite.unit.batchUpdateDeactivationReasons).toHaveBeenCalledTimes(1)
        expect(target.sendProd360KafkaNotifications).toHaveBeenCalledWith([2, 1])
      })
    })

    test('it does not query db by id if no units not containing a set entry id are given', () => {
      const payload = [
        { setEntryId: 1, deactivationReason: 'foo' },
        { setEntryId: 2, deactivationReason: 'bar' },
      ]
      const setEntryIdMockReturnValue = [
        { set_entry_id: 1, deactivationReason: null, treatment_block_id: 2 },
        { set_entry_id: 2, deactivationReason: null, treatment_block_id: 1 },
      ]

      dbRead.unit.batchFindAllBySetEntryIds = mockResolve(setEntryIdMockReturnValue)
      dbRead.unit.batchFindAllByIds = mockResolve()
      dbWrite.unit.batchUpdateDeactivationReasons = mockResolve()
      target.sendDeactivationNotifications = mock()
      target.sendProd360KafkaNotifications = mockResolve()

      return target.deactivateExperimentalUnits(payload, context, testTx).then(() => {
        expect(dbRead.unit.batchFindAllBySetEntryIds).toHaveBeenCalledTimes(1)
        expect(dbRead.unit.batchFindAllByIds).not.toHaveBeenCalled()
        expect(dbWrite.unit.batchUpdateDeactivationReasons).toHaveBeenCalledTimes(1)
        expect(target.sendProd360KafkaNotifications).toHaveBeenCalledWith([2, 1])
      })
    })

    test('calls the sendDeactivationNotifications function', () => {
      const payload = [
        { setEntryId: 1, deactivationReason: 'foo' },
        { id: 2, deactivationReason: 'bar' },
      ]
      const setEntryIdMockReturnValue = [{ set_entry_id: 1, deactivation_reason: null }]
      const unitMockReturnValue = [{ id: 2, deactivationReason: null, set_entry_id: 7 }]

      dbRead.unit.batchFindAllBySetEntryIds = mockResolve(setEntryIdMockReturnValue)
      dbRead.unit.batchFindAllByIds = mockResolve(unitMockReturnValue)
      dbWrite.unit.batchUpdateDeactivationReasons = mockResolve()
      target.sendDeactivationNotifications = mock()
      target.sendProd360KafkaNotifications = mockResolve()

      return target.deactivateExperimentalUnits(payload, context, testTx).then(() => {
        expect(target.sendDeactivationNotifications).toHaveBeenCalled()
      })
    })
  })

  describe('sendDeactivationNotifications', () => {
    target = new ExperimentalUnitService()

    test('does nothing if kafka is disabled', () => {
      KafkaProducer.publish = mock()
      kafkaConfig.enableKafka = 'false'

      target.sendDeactivationNotifications()

      expect(KafkaProducer.publish).not.toHaveBeenCalled()
    })

    test('sends a notification for each deactivation if kafka is enabled', () => {
      KafkaProducer.publish = mock()
      kafkaConfig.enableKafka = 'true'

      target.sendDeactivationNotifications([{}, {}])

      expect(KafkaProducer.publish).toHaveBeenCalledTimes(2)
    })

    test('formats the deactivations before sending', () => {
      KafkaProducer.publish = mock()
      kafkaConfig.enableKafka = 'true'
      kafkaConfig.topics.unitDeactivation = 'deactivationTopic'
      kafkaConfig.schema.unitDeactivation = 1234

      target.sendDeactivationNotifications([{ id: 5, deactivationReason: 'test reason', setEntryId: 7 }])

      expect(KafkaProducer.publish).toHaveBeenCalledWith({
        topic: 'deactivationTopic',
        message: { experimentalUnitId: 5, deactivationReason: 'test reason', setEntryId: 7 },
        schemaId: 1234,
        schema: {
          type: 'record',
          fields: [
            {
              name: 'experimentalUnitId',
              type: 'int',
            },
            {
              name: 'deactivationReason',
              type: [
                'null',
                'string',
              ],
              default: null,
            },
            {
              name: 'setEntryId',
              type: 'int',
            },
          ],
        },
      })
    })

    test('does not throw if the KafkaProducer publish throws', () => {
      KafkaProducer.publish = () => { throw new Error() }
      kafkaConfig.enableKafka = 'true'
      kafkaConfig.topics.unitDeactivation = 'deactivationTopic'
      kafkaConfig.schema.unitDeactivation = 1234

      expect(() => target.sendDeactivationNotifications([{ id: 5, deactivationReason: 'test reason', setEntryId: 7 }])).not.toThrow()
    })
  })

  describe('validatedDeactivations', () => {
    const testError = { message: 'error' }

    test('throws if not every unit in payload has a deactivationReason', () => {
      QuestionsUtil.getAnswerKeys = mockResolve([])
      const payload = [
        { setEntryId: 1 },
        { id: 2, deactivationReason: 'bar' },
      ]
      AppError.badRequest = mock(testError)

      return target.validateDeactivations(payload).catch((error) => {
        expect(error).toBe(testError)
        expect(QuestionsUtil.getAnswerKeys).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Please provide a deactivation reason for each experimental unit to be deactivated.', undefined, '17L001')
      })
    })

    test('throws if a deactivationReason is not in the questions system', () => {
      QuestionsUtil.getAnswerKeys = mockResolve(['fizz', 'bang', 'foo', 'bar'])
      const payload = [
        { setEntryId: 1, deactivationReason: 'foo' },
        { id: 2, deactivationReason: 'biz' },
      ]
      AppError.badRequest = mock(testError)

      return target.validateDeactivations(payload).catch((error) => {
        expect(error).toBe(testError)
        expect(QuestionsUtil.getAnswerKeys).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid deactivation reasons provided: ["biz"]', undefined, '17L002')
      })
    })

    test('does not handle errors thrown by QuestionsUtil', () => {
      QuestionsUtil.getAnswerKeys = mockReject(testError)
      const payload = [
        { setEntryId: 1 },
        { id: 2, deactivationReason: 'bar' },
      ]
      AppError.badRequest = mock(testError)

      return target.validateDeactivations(payload).catch((error) => {
        expect(error).toBe(testError)
        expect(QuestionsUtil.getAnswerKeys).toHaveBeenCalled()
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })

    test('returns undefined if all validations pass', () => {
      QuestionsUtil.getAnswerKeys = mockResolve(['fizz', 'bang', 'foo', 'bar'])
      const payload = [
        { setEntryId: 1, deactivationReason: 'foo' },
        { id: 2, deactivationReason: null },
      ]
      AppError.badRequest = mock(testError)

      return target.validateDeactivations(payload).then((result) => {
        expect(result).toBe(undefined)
        expect(QuestionsUtil.getAnswerKeys).toHaveBeenCalled()
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })
  })

  describe('getUnitsFromTemplateByExperimentId', () => {
    test('The call fails getExperimentById check', () => {
      target.experimentService.findExperimentWithTemplateCheck = mockReject()
      target.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])

      return target.getUnitsFromTemplateByExperimentId(1, {}).catch(() => {
        expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, true, {})
        expect(target.getExperimentalUnitsByExperimentIdNoValidate).not.toHaveBeenCalled()
      })
    })

    test('The call passes getExperimentById check', () => {
      target.experimentService.findExperimentWithTemplateCheck = mockResolve()
      target.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])

      return target.getUnitsFromTemplateByExperimentId(1, {}).then((data) => {
        expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, true, {})
        expect(target.getExperimentalUnitsByExperimentIdNoValidate).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })
  })

  describe('getUnitsFromExperimentByExperimentId', () => {
    test('The call fails getExperimentById check', () => {
      target.experimentService.findExperimentWithTemplateCheck = mockReject()
      target.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])

      return target.getUnitsFromExperimentByExperimentId(1, {}).catch(() => {
        expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, false, {})
        expect(target.getExperimentalUnitsByExperimentIdNoValidate).not.toHaveBeenCalled()
      })
    })

    test('The call passes getExperimentById check', () => {
      target.experimentService.findExperimentWithTemplateCheck = mockResolve()
      target.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])

      return target.getUnitsFromExperimentByExperimentId(1, {}).then((data) => {
        expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, false, {})
        expect(target.getExperimentalUnitsByExperimentIdNoValidate).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })
  })

  describe('getExperimentalUnitsBySetIds', () => {
    test('calls batchFindAllBySetIds on the unit repo', () => {
      const expectedResult = [trimmedUnit]
      dbRead.unit.batchFindAllBySetIds = mockResolve(expectedResult)

      return target.getExperimentalUnitsBySetIds(1).then((result) => {
        expect(dbRead.unit.batchFindAllBySetIds).toHaveBeenCalledWith(1)
        expect(result).toEqual(expectedResult)
      })
    })
  })

  describe('batchUpdateSetEntryIds', () => {
    test('calls batchFindSetEntryIds on the unit repo', async () => {
      const requestBody = [
        { existingSetEntryId: 12216200, incomingSetEntryId: 12217200 },
        { existingSetEntryId: 12216201, incomingSetEntryId: 12217201 },
        { existingSetEntryId: 12216202, incomingSetEntryId: 12217202 },
        { existingSetEntryId: 12216203, incomingSetEntryId: 12217203 },
        { existingSetEntryId: 12216204, incomingSetEntryId: 12217204 },
        { existingSetEntryId: 12216205, incomingSetEntryId: 12217205 },
        { existingSetEntryId: 12216206, incomingSetEntryId: 12217206 },
      ]
      const existingSetEntryIds = [
        12216200,
        12216201,
        12216202,
        12216203,
        12216204,
        12216205,
        12216206,
      ]
      dbRead.unit.batchFindSetEntryIds = mockResolve(existingSetEntryIds)
      dbWrite.unit.batchUpdateSetEntryIds = mockResolve()

      await target.batchUpdateSetEntryIds(requestBody, testContext, testTx)

      expect(dbRead.unit.batchFindSetEntryIds).toHaveBeenCalledWith(existingSetEntryIds)
    })

    test('calls batchUpdateSetEntryIds on the unit repo', async () => {
      const requestBody = [
        { existingSetEntryId: 12216200, incomingSetEntryId: 12217200 },
        { existingSetEntryId: 12216201, incomingSetEntryId: 12217201 },
        { existingSetEntryId: 12216202, incomingSetEntryId: 12217202 },
        { existingSetEntryId: 12216203, incomingSetEntryId: 12217203 },
        { existingSetEntryId: 12216204, incomingSetEntryId: 12217204 },
        { existingSetEntryId: 12216205, incomingSetEntryId: 12217205 },
        { existingSetEntryId: 12216206, incomingSetEntryId: 12217206 },
      ]
      const existingSetEntryIds = [
        12216200,
        12216201,
        12216202,
        12216203,
        12216204,
        12216205,
        12216206,
      ]
      dbRead.unit.batchFindSetEntryIds = mockResolve(existingSetEntryIds)
      dbWrite.unit.batchUpdateSetEntryIds = mockResolve()

      await target.batchUpdateSetEntryIds(requestBody, testContext, testTx)

      expect(dbWrite.unit.batchUpdateSetEntryIds).toHaveBeenCalled()
    })

    test('throws error when duplicate IDs are present', () => {
      const testError = { message: 'error' }
      const requestBody = [
        { existingSetEntryId: 6200, incomingSetEntryId: 7200 },
        { existingSetEntryId: 6201, incomingSetEntryId: 6201 },
      ]
      const existingSetEntryIds = [
        6200,
        6201,
      ]
      dbRead.unit.batchFindSetEntryIds = mockResolve(existingSetEntryIds)
      dbWrite.unit.batchUpdateSetEntryIds = mockResolve()
      AppError.badRequest = mock(testError)

      return target.batchUpdateSetEntryIds(requestBody, testContext, testTx).catch((error) => {
        expect(error).toBe(testError)
        expect(AppError.badRequest).toHaveBeenCalledWith(
          'All set entry IDs in request payload must be unique',
          undefined,
          '17M001',
        )
      })
    })

    test('throws error when an existingSetEntryId in payload does not already exist in db', () => {
      const testError = { message: 'error' }
      const requestBody = [
        { existingSetEntryId: 6200, incomingSetEntryId: 7200 },
        { existingSetEntryId: 6201, incomingSetEntryId: 7201 },
      ]
      const existingSetEntryIds = [
        6200,
      ]
      dbRead.unit.batchFindSetEntryIds = mockResolve(existingSetEntryIds)
      AppError.badRequest = jest.fn(() => testError)

      return target.batchUpdateSetEntryIds(requestBody, testContext, testTx)
        .catch((error) => {
          expect(error).toBe(testError)
          expect(AppError.badRequest).toHaveBeenCalledWith(
            'One or more of the existing set entry IDs in request payload were not found',
            undefined,
            '17M002',
          )
        })
    })

    test('throws error when no incomingSetEntryId is present in one of the objects', () => {
      const testError = { message: 'error' }
      const requestBody = [
        { existingSetEntryId: 6200, incomingSetEntryId: 7200 },
        { existingSetEntryId: 6201 },
      ]
      const existingSetEntryIds = [
        6200,
        6201,
      ]
      dbRead.unit.batchFindSetEntryIds = mockResolve(existingSetEntryIds)
      AppError.badRequest = mock(testError)

      return target.batchUpdateSetEntryIds(requestBody, testContext, testTx).catch((error) => {
        expect(error).toBe(testError)
        expect(AppError.badRequest).toHaveBeenCalled()
      })
    })
  })
})
