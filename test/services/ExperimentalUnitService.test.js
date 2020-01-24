import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentalUnitService from '../../src/services/ExperimentalUnitService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import KafkaProducer from '../../src/services/kafka/KafkaProducer'
import cfServices from '../../src/services/utility/ServiceConfig'

describe('ExperimentalUnitService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  beforeEach(() => {
    target = new ExperimentalUnitService()
  })

  describe('getExperimentalUnitsByExperimentIdNoValidate', () => {
    test('calls findAllByExperimentId', () => {
      db.unit.findAllByExperimentId = mockResolve()

      return target.getExperimentalUnitsByExperimentIdNoValidate(1, testTx).then(() => {
        expect(db.unit.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
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
      db.unit.batchFindAllBySetId = mockResolve([])
      AppError.notFound = mock('')

      return target.getExperimentalUnitInfoBySetId(5).catch(() => {
        expect(AppError.notFound).toBeCalledWith('Either the set was not found or no set entries are associated with the set.', undefined, '179001')
        done()
      })
    })

    test('returns the result from the map function when data found', () => {
      const mockResult = { 1: {} }
      const repoResult = [{ set_entry_id: 1 }]
      db.unit.batchFindAllBySetId = mockResolve(repoResult)
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
      db.unit.batchFindAllBySetEntryIds = mock()
      AppError.badRequest = mock('')

      expect(() => target.getExperimentalUnitInfoBySetEntryId()).toThrow()
    })

    test('returns an empty map of Set Entry Ids', () => {
      const result = []
      const expectedMap = {}
      db.unit.batchFindAllBySetEntryIds = mockResolve(result)
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
      db.unit.batchPartialUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchPartialUpdateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PATCH', testTx)
        expect(db.unit.batchPartialUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.unit.batchPartialUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchPartialUpdateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PATCH', testTx)
        expect(db.unit.batchPartialUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.unit.batchPartialUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchPartialUpdateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PATCH', testTx)
        expect(db.unit.batchPartialUpdate).not.toHaveBeenCalled()
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
      target.locationAssocWithBlockService.getBySetId = mockResolve()
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve()
      const testError = { message: 'error' }
      AppError.notFound = mock(testError)

      return target.updateUnitsForSet(5, [], {}, testTx).catch((err) => {
        expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).toBeCalledWith('No experiment found for Set Id 5', undefined, '17F001')
        expect(err).toBe(testError)
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).not.toBeCalled()
      })
    })

    test('saves units to database if they all have treatments in the correct block', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19 },
      ]
      target = new ExperimentalUnitService()
      target.locationAssocWithBlockService.getBySetId = mockResolve({ experiment_id: 7, location: 1, block_id: 3 })
      db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId = mockResolve({ value: '2' })
      db.experiments.find = mockResolve({ randomization_strategy_code: 'custom-build-on-map' })
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
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
      db.treatmentBlock.batchFindByBlockIds = mockResolve(treatmentBlocks)
      AppError.notFound = mock()
      AppError.badRequest = mock()
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).then(() => {
        expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).not.toBeCalled()
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7, testTx)
        expect(db.experiments.find).toBeCalledWith(7, false, testTx)
        expect(db.treatmentBlock.batchFindByBlockIds).toBeCalledWith(3, testTx)
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
      target.locationAssocWithBlockService.getBySetId = mockResolve({ experiment_id: 7, location: 1, block_id: 5 })
      db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId = mockResolve({ value: '2' })
      db.experiments.find = mockResolve({ randomization_strategy_code: 'custom-build-on-map' })
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
        { treatment_id: 20 },
      ])
      db.treatmentBlock.batchFindByBlockIds = mockResolve([
        { treatment_id: 23, block_id: 5 },
        { treatment_id: 25, block_id: 5 },
        { treatment_id: 20, block_id: 5 },
      ])
      const testError = { message: 'error' }
      AppError.notFound = mock()
      AppError.badRequest = mock(testError)
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).catch((err) => {
        expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('One or more entries used a treatment from a block that does not match the set\'s block.', undefined, '17F003')
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7, testTx)
        expect(db.experiments.find).toBeCalledWith(7, false, testTx)
        expect(db.treatmentBlock.batchFindByBlockIds).toBeCalledWith(5, testTx)
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
      target.locationAssocWithBlockService.getBySetId = mockResolve({ experiment_id: 7, location: 1, block_id: 3 })
      db.experiments.find = mockResolve({ randomization_strategy_code: 'custom-build-on-map' })
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
      ])
      db.treatmentBlock.batchFindByBlockIds = mockResolve([
        { treatment_id: 23, block_id: 3 },
        { treatment_id: 24, block_id: 3 },
        { treatment_id: 25, block_id: 3 },
      ])
      AppError.notFound = mock()
      AppError.badRequest = mock(testError)
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).catch((err) => {
        expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).not.toBeCalled()
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7, testTx)
        expect(db.experiments.find).toBeCalledWith(7, false, testTx)
        expect(db.treatmentBlock.batchFindByBlockIds).not.toBeCalled()
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
      target.locationAssocWithBlockService.getBySetId = mockResolve({ experiment_id: 7, location: 1, block: null })
      db.experiments.find = mockResolve({ randomization_strategy_code: 'custom' })
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
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
        expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('This endpoint only supports sets/experiments with a "Custom - Build on Map" randomization strategy.', undefined, '17F004')
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7, testTx)
        expect(db.experiments.find).toBeCalledWith(7, false, testTx)
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
      db.unit.batchFindAllByLocationAndTreatmentBlocks = mockResolve('unitsFromDb')
      const unitsToBeSaved = [{}]

      return target.mergeSetEntriesToUnits(7, unitsToBeSaved, 5, [{ id: 3 }, { id: 4 }], {}, testTx).then(() => {
        expect(db.unit.batchFindAllByLocationAndTreatmentBlocks).toBeCalledWith(5, [3, 4], testTx)
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
      db.unit.batchCreate = mockResolve()
      db.unit.batchUpdate = mockResolve()
      db.unit.batchRemove = mockResolve()

      return target.saveToDb([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], [{ id: 5 }], [6], context, testTx).then(() => {
        expect(db.unit.batchCreate).toBeCalledWith([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], context, testTx)
        expect(db.unit.batchUpdate).toBeCalledWith([{ id: 5 }], context, testTx)
        expect(db.unit.batchRemove).toBeCalledWith([6], testTx)
      })
    })

    test('calls everything correctly when values are not present', () => {
      target = new ExperimentalUnitService()
      db.unit.batchCreate = mockResolve()
      db.unit.batchUpdate = mockResolve()
      db.unit.batchRemove = mockResolve()

      return target.saveToDb(9, [], [], [], testTx).then(() => {
        expect(db.unit.batchCreate).not.toBeCalled()
        expect(db.unit.batchUpdate).not.toBeCalled()
        expect(db.unit.batchRemove).not.toBeCalled()
      })
    })
  })

  describe('deactivateExperimentalUnits', () => {
    const context = { userId: 'FooBar Baz' }

    test('it returns deactivated units given valid input', () => {
      const payload = [
        { setEntryId: 1, deactivationReason: 'foo' },
        { id: 2, deactivationReason: 'bar' },
      ]
      const setEntryIdMockReturnValue = [{ set_entry_id: 1, deactivation_reason: null }]
      const unitMockReturnValue = [{ id: 2, deactivationReason: null, set_entry_id: 7 }]

      db.unit.batchFindAllBySetEntryIds = mockResolve(setEntryIdMockReturnValue)
      db.unit.batchFindAllByIds = mockResolve(unitMockReturnValue)
      db.unit.batchUpdateDeactivationReasons = mockResolve()
      target.sendDeactivationNotifications = mock()

      return target.deactivateExperimentalUnits(payload, context, testTx).then(() => {
        expect(db.unit.batchFindAllBySetEntryIds).toHaveBeenCalledTimes(1)
        expect(db.unit.batchFindAllByIds).toHaveBeenCalledTimes(1)
        expect(db.unit.batchUpdateDeactivationReasons).toHaveBeenCalledTimes(1)
      })
    })

    test('it does not query db by set entry id if no units containing a set entry id are given', () => {
      const payload = [
        { id: 1, deactivationReason: 'foo' },
        { id: 2, deactivationReason: 'bar' },
      ]
      const unitMockReturnValue = [
        { id: 1, deactivationReason: null, set_entry_id: 5 },
        { id: 2, deactivationReason: null, set_entry_id: 7 },
      ]

      db.unit.batchFindAllBySetEntryIds = mockResolve()
      db.unit.batchFindAllByIds = mockResolve(unitMockReturnValue)
      db.unit.batchUpdateDeactivationReasons = mockResolve()
      target.sendDeactivationNotifications = mock()

      return target.deactivateExperimentalUnits(payload, context, testTx).then(() => {
        expect(db.unit.batchFindAllBySetEntryIds).not.toHaveBeenCalled()
        expect(db.unit.batchFindAllByIds).toHaveBeenCalledTimes(1)
        expect(db.unit.batchUpdateDeactivationReasons).toHaveBeenCalledTimes(1)
      })
    })

    test('it does not query db by id if no units not containing a set entry id are given', () => {
      const payload = [
        { setEntryId: 1, deactivationReason: 'foo' },
        { setEntryId: 2, deactivationReason: 'bar' },
      ]
      const setEntryIdMockReturnValue = [
        { set_entry_id: 1, deactivationReason: null },
        { set_entry_id: 2, deactivationReason: null },
      ]

      db.unit.batchFindAllBySetEntryIds = mockResolve(setEntryIdMockReturnValue)
      db.unit.batchFindAllByIds = mockResolve()
      db.unit.batchUpdateDeactivationReasons = mockResolve()
      target.sendDeactivationNotifications = mock()

      return target.deactivateExperimentalUnits(payload, context, testTx).then(() => {
        expect(db.unit.batchFindAllBySetEntryIds).toHaveBeenCalledTimes(1)
        expect(db.unit.batchFindAllByIds).not.toHaveBeenCalled()
        expect(db.unit.batchUpdateDeactivationReasons).toHaveBeenCalledTimes(1)
      })
    })

    test('it throws if not every unit in payload has a deactivationReason', () => {
      const payload = [
        { setEntryId: 1 },
        { id: 2, deactivationReason: 'bar' },
      ]
      db.unit.batchFindAllBySetEntryIds = mockResolve()
      db.unit.batchFindAllByIds = mockResolve()
      db.unit.batchUpdateDeactivationReasons = mockResolve()
      AppError.badRequest = mock('')
      target.sendDeactivationNotifications = mock()

      expect(() => target.deactivateExperimentalUnits(payload, context, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledTimes(1)
      expect(db.unit.batchFindAllBySetEntryIds).not.toHaveBeenCalled()
      expect(db.unit.batchFindAllByIds).not.toHaveBeenCalled()
      expect(db.unit.batchUpdateDeactivationReasons).not.toHaveBeenCalled()
    })

    test('calls the sendDeactivationNotifications function', () => {
      const payload = [
        { setEntryId: 1, deactivationReason: 'foo' },
        { id: 2, deactivationReason: 'bar' },
      ]
      const setEntryIdMockReturnValue = [{ set_entry_id: 1, deactivation_reason: null }]
      const unitMockReturnValue = [{ id: 2, deactivationReason: null, set_entry_id: 7 }]

      db.unit.batchFindAllBySetEntryIds = mockResolve(setEntryIdMockReturnValue)
      db.unit.batchFindAllByIds = mockResolve(unitMockReturnValue)
      db.unit.batchUpdateDeactivationReasons = mockResolve()
      target.sendDeactivationNotifications = mock()

      return target.deactivateExperimentalUnits(payload, context, testTx).then(() => {
        expect(target.sendDeactivationNotifications).toHaveBeenCalled()
      })
    })
  })

  describe('sendDeactivationNotifications', () => {
    target = new ExperimentalUnitService()

    test('does nothing if kafka is disabled', () => {
      KafkaProducer.publish = mock()
      cfServices.experimentsKafka.value.enableKafka = 'false'

      target.sendDeactivationNotifications()

      expect(KafkaProducer.publish).not.toHaveBeenCalled()
    })

    test('sends a notification for each deactivation if kafka is enabled', () => {
      KafkaProducer.publish = mock()
      cfServices.experimentsKafka.value.enableKafka = 'true'

      target.sendDeactivationNotifications([{}, {}])

      expect(KafkaProducer.publish).toHaveBeenCalledTimes(2)
    })

    test('formats the deactivations before sending', () => {
      KafkaProducer.publish = mock()
      cfServices.experimentsKafka.value.enableKafka = 'true'
      cfServices.experimentsKafka.value.topics.unitDeactivation = 'deactivationTopic'
      cfServices.experimentsKafka.value.schema.unitDeactivation = 1234

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
      cfServices.experimentsKafka.value.enableKafka = 'true'
      cfServices.experimentsKafka.value.topics.unitDeactivation = 'deactivationTopic'
      cfServices.experimentsKafka.value.schema.unitDeactivation = 1234

      expect(() => target.sendDeactivationNotifications([{ id: 5, deactivationReason: 'test reason', setEntryId: 7 }])).not.toThrow()
    })
  })
})
