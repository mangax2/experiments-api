import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentalUnitService from '../../src/services/ExperimentalUnitService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import PingUtil from '../../src/services/utility/PingUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'

describe('ExperimentalUnitService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    expect.hasAssertions()
    target = new ExperimentalUnitService()
  })

  describe('batchCreateExperimentalUnits', () => {
    test('calls validate, batchCreate, and createPostResponse on success', () => {
      target.validator.validate = mockResolve()
      db.unit.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.unit.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validator fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.unit.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getExperimentalUnitsByTreatmentId', () => {
    test('calls getTreatmentById and findAllByTreatmentId', () => {
      target.treatmentService.getTreatmentById = mockResolve()
      db.unit.findAllByTreatmentId = mockResolve()

      return target.getExperimentalUnitsByTreatmentId(1, {}, testTx).then(() => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, {}, testTx)
        expect(db.unit.findAllByTreatmentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    test('rejects when call to findAllByTreatmentId fails', () => {
      const error = { message: 'error' }
      target.treatmentService.getTreatmentById = mockResolve()
      db.unit.findAllByTreatmentId = mockReject(error)

      return target.getExperimentalUnitsByTreatmentId(1, {}, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, {}, testTx)
        expect(db.unit.findAllByTreatmentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when call to getTreatmentById fails', () => {
      const error = { message: 'error' }
      target.treatmentService.getTreatmentById = mockReject(error)
      db.unit.findAllByTreatmentId = mock()

      return target.getExperimentalUnitsByTreatmentId(1, {}, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, {}, testTx)
        expect(db.unit.findAllByTreatmentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
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

  describe('getTreatmentDetailsBySetId', () => {
    test('throws an error when a setId is not supplied', () => {
      db.unit.batchFindAllBySetId = mock()
      AppError.badRequest = mock('')

      expect(() => target.getTreatmentDetailsBySetId(undefined, testTx)).toThrow()
    })

    test('calls batchFindAllBySetId and batchFindAllTreatmentLevelDetails and mapTreatmentLevelsToOutputFormat', () => {
      db.unit.batchFindAllBySetId = mockResolve([{ treatment_id: 1 }, { treatment_id: 2 }])

      const treatmentLevelDetails = [
        {
          treatment_id: 1,
          value: { id: 1 },
        },
        {
          treatment_id: 1,
          value: { id: 2 },
        },
        {
          treatment_id: 2,
          value: { id: 3 },
        },
        {
          treatment_id: 2,
          value: { id: 4 },
        },
      ]
      db.treatment.batchFindAllTreatmentLevelDetails = mockResolve(treatmentLevelDetails)

      target = new ExperimentalUnitService()
      target.mapTreatmentLevelsToOutputFormat = mock()

      return target.getTreatmentDetailsBySetId(1, testTx).then(() => {
        expect(db.unit.batchFindAllBySetId).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.batchFindAllTreatmentLevelDetails).toHaveBeenCalledWith([1, 2], testTx)
        expect(target.mapTreatmentLevelsToOutputFormat).toHaveBeenCalledWith(treatmentLevelDetails)
      })
    })

    test('rejects when batchFindAllBySetId fails', () => {
      const error = { message: 'error' }
      db.unit.batchFindAllBySetId = mockReject(error)

      db.treatment.batchFindAllTreatmentLevelDetails = mock()

      target = new ExperimentalUnitService()
      target.mapTreatmentLevelsToOutputFormat = mock()

      return target.getTreatmentDetailsBySetId(1, testTx).then(() => {}, (err) => {
        expect(err).toEqual(error)
        expect(db.unit.batchFindAllBySetId).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.batchFindAllTreatmentLevelDetails).not.toHaveBeenCalled()
        expect(target.mapTreatmentLevelsToOutputFormat).not.toHaveBeenCalled()
      })
    })

    test('rejects when batchFindAllTreatmentLevelDetails fails', () => {
      db.unit.batchFindAllBySetId = mockResolve([{ treatment_id: 1 }, { treatment_id: 2 }])

      db.treatment.batchFindAllTreatmentLevelDetails = mockReject('error')

      target = new ExperimentalUnitService()
      target.mapTreatmentLevelsToOutputFormat = mock()

      return target.getTreatmentDetailsBySetId(1, testTx).then(() => {}, () => {
        expect(db.unit.batchFindAllBySetId).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.batchFindAllTreatmentLevelDetails).toHaveBeenCalledWith([1, 2], testTx)
        expect(target.mapTreatmentLevelsToOutputFormat).not.toHaveBeenCalled()
      })
    })

    test('throws an error when no treatments are found', () => {
      db.unit.batchFindAllBySetId = mockResolve([])

      db.treatment.batchFindAllTreatmentLevelDetails = mock()
      AppError.notFound = mock('')

      target = new ExperimentalUnitService()
      target.mapTreatmentLevelsToOutputFormat = mock()

      return target.getTreatmentDetailsBySetId(1, testTx).then(() => {}, () => {
        expect(db.unit.batchFindAllBySetId).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.batchFindAllTreatmentLevelDetails).not.toHaveBeenCalled()
        expect(target.mapTreatmentLevelsToOutputFormat).not.toHaveBeenCalled()
        expect(AppError.notFound).toHaveBeenCalled()
      })
    })
  })

  describe('mapTreatmentLevelsToOutputFormat', () => {
    test('adds levels to the treatmentLevelsMap in the correct places', () => {
      const data = [
        {
          treatment_id: 1,
          name: '1',
          value: { items: [{ id: 1 }] },
        },
        {
          treatment_id: 1,
          name: '2',
          value: { items: [{ id: 2 }] },
        },
        {
          treatment_id: 2,
          name: '3',
          value: { items: [{ id: 3 }] },
        },
        {
          treatment_id: 2,
          name: '4',
          value: { items: [{ id: 4 }] },
        },
      ]

      target = new ExperimentalUnitService()

      expect(target.mapTreatmentLevelsToOutputFormat(data)).toEqual([
        {
          treatmentId: 1,
          factorLevels: [
            {
              factorName: '1',
              items: [{ id: 1 }],
            },
            {
              factorName: '2',
              items: [{ id: 2 }],
            },
          ],
        },
        {
          treatmentId: 2,
          factorLevels: [
            {
              factorName: '3',
              items: [{ id: 3 }],
            },
            {
              factorName: '4',
              items: [{ id: 4 }],
            },
          ],
        },
      ])
    })
  })

  describe('getExperimentalUnitById', () => {
    test('calls find and returns data', () => {
      db.unit.find = mockResolve({})

      return target.getExperimentalUnitById(1, {}, testTx).then((data) => {
        expect(db.unit.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    test('throws an error when data is undefined', () => {
      db.unit.find = mockResolve()
      AppError.notFound = mock()

      return target.getExperimentalUnitById(1, {}, testTx).then(() => {}, () => {
        expect(db.unit.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experimental Unit Not Found for requested id', undefined, '176001')
      })
    })
  })

  describe('getExperimentalUnitsByExperimentId', () => {
    test('calls getExperimentById and findAllByExperimentId', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.unit.findAllByExperimentId = mock()

      return target.getExperimentalUnitsByExperimentId(1, false, testContext, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.unit.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      db.unit.findAllByExperimentId = mock()

      return target.getExperimentalUnitsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.unit.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchUpdateExperimentalUnits', () => {
    test('calls validate, batchUpdate, and createPutResponse', () => {
      target.validator.validate = mockResolve()
      db.unit.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.unit.batchUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.unit.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
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
      db.locationAssociation.findBySetId = mockResolve()
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve()
      const testError = { message: 'error' }
      AppError.notFound = mock(testError)

      return target.updateUnitsForSet(5, [], {}, testTx).catch((err) => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).toBeCalledWith('No experiment found for Set Id 5', undefined, '17F001')
        expect(err).toBe(testError)
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).not.toBeCalled()
      })
    })

    test('saves units to database if they all have treatments', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19, factorLevelIds: [] },
      ]
      target = new ExperimentalUnitService()
      db.locationAssociation.findBySetId = mockResolve({ experiment_id: 7, location: 1 })
      db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId = mockResolve({ value: '2' })
      PingUtil.getMonsantoHeader = mockResolve()
      HttpUtil.getWithRetry = mockResolve({ body: [{ id: 2, name: 'Custom - Build on Map' }] })
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
        { treatment_id: 20 },
      ])
      AppError.notFound = mock()
      AppError.badRequest = mock()
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).then(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).not.toBeCalled()
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7, testTx)
        expect(db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId).toBeCalledWith(7, testTx)
        expect(target.mergeSetEntriesToUnits).toBeCalledWith(7, [
          { setEntryId: 15, treatmentId: 23 },
          { setEntryId: 17, treatmentId: 24 },
          { setEntryId: 19, treatmentId: 20 },
        ], 1, {}, testTx)
      })
    })

    test('returns an error if a matching treatment is not found', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19, factorLevelIds: [] },
      ]
      const testError = { message: 'error' }
      target = new ExperimentalUnitService()
      db.locationAssociation.findBySetId = mockResolve({ experiment_id: 7, location: 1 })
      db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId = mockResolve({ value: '2' })
      PingUtil.getMonsantoHeader = mockResolve()
      HttpUtil.getWithRetry = mockResolve({ body: [{ id: 2, name: 'Custom - Build on Map' }] })
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
      ])
      AppError.notFound = mock()
      AppError.badRequest = mock(testError)
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).catch((err) => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).not.toBeCalled()
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7, testTx)
        expect(db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId).toBeCalledWith(7, testTx)
        expect(target.mergeSetEntriesToUnits).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('One or more entries had an invalid set of factor level ids.', undefined, '17F002')
        expect(err).toBe(testError)
      })
    })

    test('returns an error if the randomization strategy is not Custom - Build on Map', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19, factorLevelIds: [] },
      ]
      const testError = { message: 'error' }
      target = new ExperimentalUnitService()
      db.locationAssociation.findBySetId = mockResolve({ experiment_id: 7, location: 1 })
      db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId = mockResolve({ value: '3' })
      PingUtil.getMonsantoHeader = mockResolve()
      HttpUtil.getWithRetry = mockResolve({ body: [{ id: 2, name: 'Custom' }] })
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
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('This endpoint only supports sets/experiments with a "Custom - Build on Map" randomization strategy.', undefined, '17F004')
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7, testTx)
        expect(db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId).toBeCalledWith(7, testTx)
        expect(target.mergeSetEntriesToUnits).not.toBeCalled()
        expect(err).toBe(testError)
      })
    })

    test('returns an error if the randomization strategy service throws an error', () => {
      const entries = [
        { setEntryId: 15, factorLevelIds: [13, 11] },
        { setEntryId: 17, factorLevelIds: [12] },
        { setEntryId: 19, factorLevelIds: [] },
      ]
      const testError = { message: 'error' }
      target = new ExperimentalUnitService()
      db.locationAssociation.findBySetId = mockResolve({ experiment_id: 7, location: 1 })
      db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId = mockResolve({ value: '3' })
      PingUtil.getMonsantoHeader = mockResolve()
      HttpUtil.getWithRetry = mockReject()
      db.combinationElement.findAllByExperimentIdIncludingControls = mockResolve([
        { factor_level_id: 13, treatment_id: 23 },
        { factor_level_id: 11, treatment_id: 23 },
        { factor_level_id: 12, treatment_id: 24 },
        { factor_level_id: 12, treatment_id: 25 },
        { factor_level_id: 13, treatment_id: 25 },
        { treatment_id: 20 },
      ])
      AppError.notFound = mock()
      AppError.badRequest = mock()
      AppError.internalServerError = mock(testError)
      target.mergeSetEntriesToUnits = mockResolve()

      return target.updateUnitsForSet(5, entries, {}, testTx).catch((err) => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(AppError.notFound).not.toBeCalled()
        expect(AppError.badRequest).not.toBeCalled()
        expect(AppError.internalServerError).toBeCalledWith('An error occurred while communicating with the randomization service.', undefined, '17F003')
        expect(db.combinationElement.findAllByExperimentIdIncludingControls).toBeCalledWith(7, testTx)
        expect(db.designSpecificationDetail.getRandomizationStrategyIdByExperimentId).toBeCalledWith(7, testTx)
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
      db.unit.batchFindAllByExperimentIdAndLocation = mockResolve('unitsFromDb')

      return target.mergeSetEntriesToUnits(7, 'unitsToSave', 5, {}, testTx).then(() => {
        expect(db.unit.batchFindAllByExperimentIdAndLocation).toBeCalledWith(7, 5, testTx)
        expect(target.getDbActions).toBeCalledWith('unitsToSave', 'unitsFromDb', 5)
        expect(target.saveToDb).toBeCalledWith('unitsToBeCreated', 'unitsToBeUpdated', 'unitsToBeDeleted', {}, testTx)
      })
    })
  })

  describe('getDbActions', () => {
    test('correctly categorizes units', () => {
      const unitsFromMessage = [{
        rep: 1,
        setEntryId: 234,
        treatmentId: 7,
      }, {
        rep: 1,
        setEntryId: 235,
        treatmentId: 8,
      }, {
        rep: 1,
        setEntryId: 236,
        treatmentId: 9,
      }, {
        rep: 2,
        setEntryId: 237,
        treatmentId: 7,
      }]
      const unitsFromDb = [{
        id: 55,
        rep: 1,
        setEntryId: 233,
        treatmentId: 8,
        location: 1,
      }, {
        id: 66,
        rep: 1,
        setEntryId: 234,
        treatmentId: 7,
        location: 1,
      }, {
        id: 77,
        rep: 1,
        setEntryId: 235,
        treatmentId: 9,
        location: 1,
      }]

      target = new ExperimentalUnitService()

      const result = target.getDbActions(unitsFromMessage, unitsFromDb, 1)

      expect(result).toEqual({
        unitsToBeCreated: [{
          rep: 1,
          setEntryId: 236,
          treatmentId: 9,
          location: 1,
        }, {
          rep: 2,
          setEntryId: 237,
          treatmentId: 7,
          location: 1,
        }],
        unitsToBeUpdated: [{
          id: 77,
          rep: 1,
          setEntryId: 235,
          treatmentId: 8,
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
      db.unit = {
        batchCreate: jest.fn(() => Promise.resolve()),
        batchUpdate: jest.fn(() => Promise.resolve()),
        batchRemove: jest.fn(() => Promise.resolve()),
      }

      return target.saveToDb([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], [{ id: 5 }], [6], context, {}).then(() => {
        expect(db.unit.batchCreate).toBeCalledWith([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], context, {})
        expect(db.unit.batchUpdate).toBeCalledWith([{ id: 5 }], context, {})
        expect(db.unit.batchRemove).toBeCalledWith([6], {})
      })
    })

    test('calls everything correctly when values are not present', () => {
      target = new ExperimentalUnitService()
      db.unit = {
        batchCreate: jest.fn(() => Promise.resolve()),
        batchUpdate: jest.fn(() => Promise.resolve()),
        batchRemove: jest.fn(() => Promise.resolve()),
      }

      return target.saveToDb(9, [], [], [], [], {}).then(() => {
        expect(db.unit.batchCreate).not.toBeCalled()
        expect(db.unit.batchUpdate).not.toBeCalled()
        expect(db.unit.batchRemove).not.toBeCalled()
      })
    })
  })
})
