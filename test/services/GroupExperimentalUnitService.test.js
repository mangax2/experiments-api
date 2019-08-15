import {
  kafkaProducerMocker, mock, mockReject, mockResolve,
} from '../jestUtil'
import GroupExperimentalUnitService from '../../src/services/GroupExperimentalUnitService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'
import AWSUtil from '../../src/services/utility/AWSUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'
import cfServices from '../../src/services/utility/ServiceConfig'

describe('GroupExperimentalUnitService', () => {
  kafkaProducerMocker()

  let target
  const testContext = {}
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  beforeEach(() => {
    expect.hasAssertions()
    target = new GroupExperimentalUnitService()
    target.unitValidator = { validate: () => Promise.resolve() }
  })

  describe('batchDeleteExperimentalUnits', () => {
    test('does not call experimentalUnitService if no units passed in', () => {
      db.unit = { batchRemove: mockResolve() }

      return target.batchDeleteExperimentalUnits([], testTx).then(() => {
        expect(db.unit.batchRemove).not.toBeCalled()
      })
    })

    test('does call experimentalUnitService if units are passed in', () => {
      db.unit = { batchRemove: mockResolve() }

      return target.batchDeleteExperimentalUnits([{ id: 5 }], testTx).then(() => {
        expect(db.unit.batchRemove).toBeCalledWith([5], testTx)
      })
    })
  })

  describe('createExperimentalUnits', () => {
    test('does nothing if no units are passed in', () => {
      db.unit.batchCreate = mockResolve()

      return target.createExperimentalUnits(1, [], testContext, testTx).then((data) => {
        expect(db.unit.batchCreate).not.toBeCalled()
        expect(data).toEqual(undefined)
      })
    })

    test('batch creates experimental units', () => {
      db.unit.batchCreate = mockResolve([1])

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then((data) => {
        expect(db.unit.batchCreate).toHaveBeenCalledWith([{ treatmentId: 1 }], testContext, testTx)
        expect(data).toEqual([1])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      db.unit.batchCreate = mockReject(error)

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, (err) => {
        expect(db.unit.batchCreate).toHaveBeenCalledWith([{ treatmentId: 1 }], testContext, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('resetSet', () => {
    cfServices.experimentsExternalAPIUrls = {
      value: {
        setsAPIUrl: 'testUrl',
      },
    }
    const header = ['header']
    const generatedUnits = [
      {
        location: 2, rep: 1, treatmentBlockId: 1,
      },
      {
        location: 2, rep: 1, treatmentBlockId: 2,
      },
      {
        location: 2, rep: 2, treatmentBlockId: 1,
      },
      {
        location: 2, rep: 2, treatmentBlockId: 2,
      },
      {
        location: 2, rep: 3, treatmentBlockId: 1,
      },
      {
        location: 2, rep: 3, treatmentBlockId: 2,
      },
    ]
    const unitsFromDB = [
      {
        location: 2, rep: 1, treatment_block_id: 1, id: 101,
      },
      {
        location: 2, rep: 1, treatment_block_id: 2, id: 102,
      },
      {
        location: 2, rep: 2, treatment_block_id: 1, id: 103,
      },
      {
        location: 2, rep: 2, treatment_block_id: 2, id: 104,
      },
      {
        location: 2, rep: 3, treatment_block_id: 1, id: 105,
      },
      {
        location: 2, rep: 3, treatment_block_id: 2, id: 106,
      },
    ]
    const unitsWithSetEntries = [
      {
        id: 101, location: 2, rep: 1, treatmentBlockId: 1, setEntryId: 1001,
      },
      {
        id: 102, location: 2, rep: 1, treatmentBlockId: 2, setEntryId: 1002,
      },
      {
        id: 103, location: 2, rep: 2, treatmentBlockId: 1, setEntryId: 1003,
      },
      {
        id: 104, location: 2, rep: 2, treatmentBlockId: 2, setEntryId: 1004,
      },
      {
        id: 105, location: 2, rep: 3, treatmentBlockId: 1, setEntryId: 1005,
      },
      {
        id: 106, location: 2, rep: 3, treatmentBlockId: 2, setEntryId: 1006,
      },
    ]
    const setEntriesResponse = { body: { entries: [{ entryId: 1001 }, { entryId: 1002 }, { entryId: 1003 }, { entryId: 1004 }, { entryId: 1005 }, { entryId: 1006 }] } }
    const setId = 5
    const setDetails = {
      experimentId: 3,
      location: 2,
      numberOfReps: 3,
      blockId: 33,
    }

    beforeEach(() => {
      target.verifySetAndGetDetails = mockResolve(setDetails)
      db.treatmentBlock.findByBlockId = mockResolve([{ id: 1 }, { id: 2 }])
      db.unit.batchFindAllByLocationAndTreatmentBlocks = mockResolve(unitsFromDB)
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve(header)
      HttpUtil.delete = mockResolve()
      HttpUtil.patch = mockResolve(setEntriesResponse)
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockResolve()
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [{}, {}, {}, {}] } })
      AppError.internalServerError = mock()
    })

    test('calls all the correct services', () =>
      target.resetSet(setId, {}, testTx).then(() => {
        expect(target.verifySetAndGetDetails).toBeCalledWith(setId, {}, testTx)
        expect(db.treatmentBlock.findByBlockId).toBeCalledWith(setDetails.blockId, testTx)
        expect(target.saveUnitsBySetId).toBeCalledWith(setId, setDetails.experimentId, generatedUnits, {}, testTx)
        expect(PingUtil.getMonsantoHeader).toBeCalledWith()
        expect(HttpUtil.getWithRetry).toBeCalledWith('testUrl/sets/5?entries=true', header)
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}], layout: [] })
        expect(target.experimentalUnitService.batchPartialUpdateExperimentalUnits).toBeCalledWith(unitsWithSetEntries, {}, testTx)
      }))

    test('calls patch sets twice when there are existing entries that need to be deleted', () => {
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [{}, {}, {}, {}] } })

      return target.resetSet(setId, {}, testTx).then(() => {
        expect(HttpUtil.patch).toHaveBeenCalledTimes(2)
        expect(HttpUtil.patch).toHaveBeenNthCalledWith(1, 'testUrl/sets/5', header, { entries: [{ deleted: true }, { deleted: true }, { deleted: true }, { deleted: true }] })
        expect(HttpUtil.patch).toHaveBeenNthCalledWith(2, 'testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}], layout: [] })
      })
    })

    test('calls patch sets once when there are NO existing entries that need to be deleted', () => {
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [] } })

      return target.resetSet(setId, {}, testTx).then(() => {
        expect(HttpUtil.patch).toHaveBeenCalledTimes(1)
        expect(HttpUtil.patch).toHaveBeenCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}], layout: [] })
      })
    })

    test('sends the correct error and code back when sets error occurs', (done) => {
      PingUtil.getMonsantoHeader = mockReject({ response: { error: {} } })

      return target.resetSet(setId, {}, testTx).catch(() => {
        expect(AppError.internalServerError).toBeCalledWith('An error occurred while communicating with the sets service.', undefined, '1Fd001')
        done()
      })
    })

    test('does not send sets error when error occurs while saving setEntryIds', (done) => {
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockReject()

      return target.resetSet(5, {}, testTx).catch(() => {
        expect(AppError.internalServerError).not.toBeCalled()
        done()
      })
    })
  })

  describe('verifySetAndGetDetails', () => {
    test('returns the expected data', () => {
      target.locationAssocWithBlockService.getBySetId = mockResolve({ location: 1, experiment_id: 5, set_id: 3, block_id: 44 })
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{ ref_design_spec_id: 12, value: 2 }])
      db.refDesignSpecification.all = mockResolve([{ id: 12, name: 'Reps' }, { id: 11, name: 'Min Rep' }, { id: 13, name: 'Locations' }])

      return target.verifySetAndGetDetails(3, {}, testTx).then((result) => {
        expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(3, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalledWith(5, testTx)
        expect(db.refDesignSpecification.all).toBeCalledWith()

        expect(result).toEqual({
          experimentId: 5,
          location: 1,
          numberOfReps: 2,
          blockId: 44,
        })
      })
    })

    test('throws correct error when set is not found', (done) => {
      target.locationAssocWithBlockService.getBySetId = mockResolve()
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{ ref_design_spec_id: 12, value: 2 }])
      AppError.notFound = mock()

      return target.verifySetAndGetDetails(3, {}, testTx).catch(() => {
        expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(3, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).not.toBeCalled()
        expect(AppError.notFound).toBeCalledWith('No set found for id 3', undefined, '1FK001')

        done()
      })
    })

    test('throws correct error when number of reps not found', (done) => {
      target.locationAssocWithBlockService.getBySetId = mockResolve({ location: 1, experiment_id: 5, set_id: 3, block_id: 44 })
      db.designSpecificationDetail = { findAllByExperimentId: mockResolve([{ ref_design_spec_id: 13, value: 2 }]) }
      db.refDesignSpecification = { all: mockResolve([{ id: 12, name: 'Reps' }, { id: 11, name: 'Min Rep' }, { id: 13, name: 'Locations' }]) }
      AppError.badRequest = mock()

      return target.verifySetAndGetDetails(3, {}, testTx).catch(() => {
        expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(3, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalledWith(5, testTx)
        expect(db.refDesignSpecification.all).toBeCalledWith()
        expect(AppError.badRequest).toBeCalledWith('The specified set (id 3) does not have a minimum number of reps and cannot be reset.', undefined, '1FK002')

        done()
      })
    })
  })

  describe('getGroupsAndUnits', () => {
    test('properly sends and retrieves data to lambda', () => {
      target = new GroupExperimentalUnitService()
      target.unitWithBlockService.getExperimentalUnitsByExperimentId = mockResolve([{ location: 1, block: null }])
      target.treatmentWithBlockService.getTreatmentsByExperimentId = mockResolve([{ id: 7, block: null }])
      target.locationAssocWithBlockService.getByExperimentId = mockResolve('setIds')
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { items: [{}] } }, { id: 5, factor_id: 1, value: { items: [{}, {}] } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 }])
      db.experiments.findExperimentOrTemplate = mockResolve({ randomizationStrategyCode: 'rcb' })
      AWSUtil.callLambda = mockResolve({ Payload: JSON.stringify({ locationGroups: [{ test: 'message' }] }) })
      AppError.internalServerError = mock()
      target.lambdaPerformanceService.savePerformanceStats = mockResolve()

      const expectedLambdaPayload = {
        experimentId: 5,
        variables: [
          {
            id: 1,
            name: 'var1',
            levels: [
              { id: 3, factorId: 1, items: {} },
              { id: 5, factorId: 1, items: [{}, {}] },
            ],
          },
        ],
        designSpecs: 'designSpecs',
        refDesignSpecs: 'refDesignSpecs',
        treatments: [
          {
            id: 7,
            block: null,
            combinationElements: [
              {
                treatmentId: 7,
                factorLevelId: 3,
              },
              {
                treatmentId: 7,
                factorLevelId: 5,
              },
            ],
          },
        ],
        units: [{ location: 1, block: null }],
        setLocAssociations: 'setIds',
      }

      return target.getGroupsAndUnits(5, testTx).then((data) => {
        expect(target.treatmentWithBlockService.getTreatmentsByExperimentId).toBeCalled()
        expect(target.unitWithBlockService.getExperimentalUnitsByExperimentId).toBeCalled()
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(target.locationAssocWithBlockService.getByExperimentId).toBeCalled()
        expect(db.experiments.findExperimentOrTemplate).toHaveBeenCalled()
        expect(AWSUtil.callLambda).toBeCalledWith('cosmos-group-generation-lambda-dev', JSON.stringify(expectedLambdaPayload))
        expect(AppError.internalServerError).not.toBeCalled()
        expect(data).toContainEqual({ test: 'message' })
        expect(target.lambdaPerformanceService.savePerformanceStats).toBeCalled()
      })
    })

    test('properly handles lambda errors', () => {
      target = new GroupExperimentalUnitService()
      target.unitWithBlockService.getExperimentalUnitsByExperimentId = mockResolve('units')
      target.treatmentWithBlockService.getTreatmentsByExperimentId = mockResolve([{ id: 7, block: null }])
      target.locationAssocWithBlockService.getByExperimentId = mockResolve('setIds')
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 }])
      db.experiments.findExperimentOrTemplate = mockResolve({ randomizationStrategyCode: 'rcb' })
      AWSUtil.callLambda = mockReject()
      AppError.internalServerError = mock({ message: 'error result' })
      target.lambdaPerformanceService.savePerformanceStats = mockResolve()

      return target.getGroupsAndUnits(5, testTx).catch(() => {
        expect(target.treatmentWithBlockService.getTreatmentsByExperimentId).toBeCalled()
        expect(target.unitWithBlockService.getExperimentalUnitsByExperimentId).toBeCalled()
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(target.locationAssocWithBlockService.getByExperimentId).toBeCalled()
        expect(db.experiments.findExperimentOrTemplate).toHaveBeenCalled()
        expect(AWSUtil.callLambda).toBeCalled()
        expect(AppError.internalServerError).toBeCalledWith('An error occurred while generating groups.', undefined, '1FO001')
        expect(target.lambdaPerformanceService.savePerformanceStats).not.toBeCalled()
      })
    })

    test('test multiple locations and lambda are called multiple times', () => {
      target = new GroupExperimentalUnitService()
      target.unitWithBlockService.getExperimentalUnitsByExperimentId = mockResolve([{ location: 1, block: null }, { location: 2, block: null }])
      target.treatmentWithBlockService.getTreatmentsByExperimentId = mockResolve([{ id: 7, block: null }])
      target.locationAssocWithBlockService.getByExperimentId = mockResolve('setIds')
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { items: [{}] } }, { id: 5, factor_id: 1, value: { items: [{}, {}] } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 }])
      db.experiments.findExperimentOrTemplate = mockResolve({ randomizationStrategyCode: 'rcb' })
      AWSUtil.callLambda = mockResolve({ Payload: JSON.stringify({ locationGroups: [{ test: 'message' }], inputSize: 3003, responseTime: 1 }) })
      AppError.internalServerError = mock()
      target.lambdaPerformanceService.savePerformanceStats = mockResolve()

      const expectedLambdaPayload = {
        experimentId: 5,
        variables: [
          {
            id: 1,
            name: 'var1',
            levels: [
              { id: 3, factorId: 1, items: {} },
              { id: 5, factorId: 1, items: [{}, {}] },
            ],
          },
        ],
        designSpecs: 'designSpecs',
        refDesignSpecs: 'refDesignSpecs',
        treatments: [
          {
            id: 7,
            block: null,
            combinationElements: [
              {
                treatmentId: 7,
                factorLevelId: 3,
              },
              {
                treatmentId: 7,
                factorLevelId: 5,
              },
            ],
          },
        ],
        units: [{ location: 1, block: null }],
        setLocAssociations: 'setIds',
      }

      return target.getGroupsAndUnits(5, testTx).then((data) => {
        expect(target.treatmentWithBlockService.getTreatmentsByExperimentId).toBeCalled()
        expect(target.unitWithBlockService.getExperimentalUnitsByExperimentId).toBeCalled()
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(target.locationAssocWithBlockService.getByExperimentId).toBeCalled()
        expect(db.experiments.findExperimentOrTemplate).toHaveBeenCalled()
        expect(AWSUtil.callLambda).toHaveBeenCalledTimes(2)
        expect(AWSUtil.callLambda).toBeCalledWith('cosmos-group-generation-lambda-dev', JSON.stringify(expectedLambdaPayload))
        expectedLambdaPayload.units = [{ location: 2, block: null }]
        expect(AWSUtil.callLambda).toBeCalledWith('cosmos-group-generation-lambda-dev', JSON.stringify(expectedLambdaPayload))
        expect(AppError.internalServerError).not.toBeCalled()
        expect(data).toContainEqual({ test: 'message' })
        expect(target.lambdaPerformanceService.savePerformanceStats).toHaveBeenCalledTimes(2)
      })
    })

    test('test multiple locations and blocks', () => {
      target = new GroupExperimentalUnitService()
      target.unitWithBlockService.getExperimentalUnitsByExperimentId = mockResolve([{ location: 1, block: 3 }, { location: 2, block: 1 }])
      target.treatmentWithBlockService.getTreatmentsByExperimentId = mockResolve([{ id: 7, block: 3 }, { id: 8, in_all_blocks: true }])
      target.locationAssocWithBlockService.getByExperimentId = mockResolve('setIds')
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { items: [{}] } }, { id: 5, factor_id: 1, value: { items: [{}, {}] } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 },
        { treatment_id: 8, factor_level_id: 4 }, { treatment_id: 8, factor_level_id: 6 }])
      db.experiments.findExperimentOrTemplate = mockResolve({ randomizationStrategyCode: 'rcb' })
      AWSUtil.callLambda = mockResolve({ Payload: JSON.stringify({ locationGroups: [{ test: 'message' }] }) })
      AppError.internalServerError = mock()
      target.lambdaPerformanceService.savePerformanceStats = mockResolve()

      const expectedLambdaPayload = {
        experimentId: 5,
        variables: [
          {
            id: 1,
            name: 'var1',
            levels: [
              { id: 3, factorId: 1, items: {} },
              { id: 5, factorId: 1, items: [{}, {}] },
            ],
          },
        ],
        designSpecs: 'designSpecs',
        refDesignSpecs: 'refDesignSpecs',
        treatments: [
          {
            id: 7,
            block: 3,
            combinationElements: [
              {
                treatmentId: 7,
                factorLevelId: 3,
              },
              {
                treatmentId: 7,
                factorLevelId: 5,
              },
            ],
          },
          {
            id: 8,
            inAllBlocks: true,
            combinationElements: [
              {
                treatmentId: 8,
                factorLevelId: 4,
              },
              {
                treatmentId: 8,
                factorLevelId: 6,
              },
            ],
          },
        ],
        units: [{ location: 1, block: 3 }],
        setLocAssociations: 'setIds',
      }

      return target.getGroupsAndUnits(5, testTx).then((data) => {
        expect(target.treatmentWithBlockService.getTreatmentsByExperimentId).toBeCalled()
        expect(target.unitWithBlockService.getExperimentalUnitsByExperimentId).toBeCalled()
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(target.locationAssocWithBlockService.getByExperimentId).toBeCalled()
        expect(db.experiments.findExperimentOrTemplate).toHaveBeenCalled()
        expect(AWSUtil.callLambda).toHaveBeenCalledTimes(2)
        expect(AWSUtil.callLambda).toBeCalledWith('cosmos-group-generation-lambda-dev', JSON.stringify(expectedLambdaPayload))
        expectedLambdaPayload.units = [{ location: 2, block: 1 }]
        expectedLambdaPayload.treatments = [
          {
            id: 8,
            inAllBlocks: true,
            combinationElements: [
              {
                treatmentId: 8,
                factorLevelId: 4,
              },
              {
                treatmentId: 8,
                factorLevelId: 6,
              },
            ],
          },
        ]
        expect(AWSUtil.callLambda).toBeCalledWith('cosmos-group-generation-lambda-dev', JSON.stringify(expectedLambdaPayload))
        expect(AppError.internalServerError).not.toBeCalled()
        expect(data).toContainEqual({ test: 'message' })
        expect(target.lambdaPerformanceService.savePerformanceStats).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('getGroupsAndUnitsByExperimentIds', () => {
    test('multiple experiments, getting groups succeeded', () => {
      target = new GroupExperimentalUnitService()
      target.getGroupsAndUnits = mockResolve([{ id: 1 }, { id: 2 }])
      return target.getGroupsAndUnitsByExperimentIds([111, 112], testTx).then((data) => {
        expect(target.getGroupsAndUnits).toHaveBeenCalled()
        expect(data.length).toEqual(2)
        expect(data).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 2 }]])
      })
    })

    test('multiple experiments, getting groups failed', () => {
      target = new GroupExperimentalUnitService()
      target.getGroupsAndUnits = mockReject('An error occurred')
      return target.getGroupsAndUnitsByExperimentIds([111, 112], testTx).then((data) => {
        expect(target.getGroupsAndUnits).toHaveBeenCalled()
        expect(data.length).toEqual(2)
        expect(data).toEqual([[], []])
      })
    })
  })

  describe('getGroupAndUnitsBySetId', () => {
    test('getting a group and units with a valid set id', () => {
      target = new GroupExperimentalUnitService()
      target.locationAssocWithBlockService.getBySetId = mockResolve({ set_id: 4871, experiment_id: 112, location: 1 })
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({
        id: 1,
        setId: 4781,
        parentId: null,
        setEntries: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
        ],
      })
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).toHaveBeenCalled()
        expect(group).toEqual({
          id: 1,
          setId: 4781,
          parentId: null,
          setEntries: [
            { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
          ],
        })
      })
    })

    test('getting a group and units with an invalid set id', () => {
      target = new GroupExperimentalUnitService()
      target.locationAssocWithBlockService.getBySetId = mockResolve({ set_id: 4871, experiment_id: 112, location: 1 })
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({})
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).toHaveBeenCalled()
        expect(group).toEqual({})
      })
    })

    test('getting a group and units with an empty return of the db query', () => {
      target = new GroupExperimentalUnitService()
      target.locationAssocWithBlockService.getBySetId = mockResolve(null)
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({
        id: 1,
        setId: 4781,
        parentId: null,
        setEntries: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
        ],
      })
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).not.toHaveBeenCalled()
        expect(group).toEqual({})
      })
    })

    test('getting a group and units with a failed db query', () => {
      target = new GroupExperimentalUnitService()
      target.locationAssocWithBlockService.getBySetId = mockReject('error')
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({
        id: 1,
        setId: 4781,
        parentId: null,
        setEntries: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
        ],
      })
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).not.toHaveBeenCalled()
        expect(group).toEqual({})
      })
    })
  })

  describe('getGroupAndUnitsBySetIdAndExperimentId', () => {
    test('get a group and units from a set id and experiment id', () => {
      target = new GroupExperimentalUnitService()
      target.getGroupsAndUnits = mockResolve([
        {
          id: 1,
          setId: 4781,
          parentId: null,
          childGroups: [
            {
              id: 2,
              parentId: 1,
              childGroups: [
                {
                  id: 4,
                  parentId: 2,
                  units: [{ id: 3 }],
                },
                {
                  id: 5,
                  parentId: 2,
                  childGroups: [
                    {
                      id: 6,
                      parentId: 5,
                      units: [{ id: 6 }],
                    },
                  ],
                  units: [{ id: 4 }, { id: 5 }],
                },
              ],
              units: [{ id: 1 }, { id: 2 }],
            },
            {
              id: 3,
              parentId: 1,
            },
          ],
        },
      ])
      return target.getGroupAndUnitsBySetIdAndExperimentId(4781, 112, testTx).then((group) => {
        expect(group).toEqual({
          id: 1,
          setId: 4781,
          parentId: null,
          setEntries: [
            { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
          ],
          childGroups: [
            {
              id: 2,
              parentId: 1,
              childGroups: [
                {
                  id: 4,
                  parentId: 2,
                  units: [{ id: 3 }],
                },
                {
                  id: 5,
                  parentId: 2,
                  childGroups: [
                    {
                      id: 6,
                      parentId: 5,
                      units: [{ id: 6 }],
                    },
                  ],
                  units: [{ id: 4 }, { id: 5 }],
                },
              ],
              units: [{ id: 1 }, { id: 2 }],
            },
            {
              id: 3,
              parentId: 1,
            },
          ],
        })
      })
    })

    test('get a group and units from an invalid set id and experiment id', () => {
      target = new GroupExperimentalUnitService()
      target.getGroupsAndUnits = mockResolve([
        {
          id: 1,
          setId: 4781,
          parentId: null,
        },
        {
          id: 2,
          parentId: 1,
          units: [{ id: 1 }, { id: 2 }],
        },
        {
          id: 3,
          parentId: 1,
        },
        {
          id: 4,
          parentId: 2,
          units: [{ id: 3 }],
        },
        {
          id: 5,
          parentId: 2,
          units: [{ id: 4 }, { id: 5 }],
        },
        {
          id: 6,
          parentId: 5,
          units: [{ id: 6 }],
        },
      ])
      return target.getGroupAndUnitsBySetIdAndExperimentId(4782, 112, testTx).then((group) => {
        expect(group).toEqual({})
      })
    })

    test('get a group and units from a failed AWS lambda called', () => {
      target = new GroupExperimentalUnitService()
      target.getGroupsAndUnits = mockReject('error')
      return target.getGroupAndUnitsBySetIdAndExperimentId(4782, 112, testTx).then((group) => {
        expect(group).toEqual({})
      })
    })
  })

  describe('getUnitsFromGroupsBySetId', () => {
    test('get units from a set id', () => {
      const groups = [
        {
          id: 1,
          setId: 4781,
          parentId: null,
          childGroups: [
            {
              id: 2,
              parentId: 1,
              childGroups: [
                {
                  id: 4,
                  parentId: 2,
                  units: [{ id: 3 }],
                },
                {
                  id: 5,
                  parentId: 2,
                  childGroups: [
                    {
                      id: 6,
                      parentId: 5,
                      units: [{ id: 6 }],
                    },
                  ],
                  units: [{ id: 4 }, { id: 5 }],
                },
              ],
              units: [{ id: 1 }, { id: 2 }],
            },
            {
              id: 3,
              parentId: 1,
            },
          ],
        },
      ]

      target = new GroupExperimentalUnitService()
      expect(target.getUnitsFromGroupsBySetId(groups, 4781))
        .toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }])
      expect(target.getUnitsFromGroupsBySetId(groups, 4782)).toEqual([])
    })
  })

  describe('getChildGroupUnits', () => {
    test('get units from child groups', () => {
      const group =
        {
          id: 1,
          parentId: null,
          childGroups: [
            {
              id: 2,
              parentId: 1,
              childGroups: [
                {
                  id: 4,
                  parentId: 2,
                  units: [{ id: 3 }],
                },
                {
                  id: 5,
                  parentId: 2,
                  childGroups: [
                    {
                      id: 6,
                      parentId: 5,
                      units: [{ id: 6 }],
                    },
                  ],
                  units: [{ id: 4 }, { id: 5 }],
                },
              ],
              units: [{ id: 1 }, { id: 2 }],
            },
            {
              id: 3,
              parentId: 1,
            },
          ],
        }

      target = new GroupExperimentalUnitService()
      expect(target.getChildGroupUnits(group))
        .toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }])
    })
  })

  describe('saveDesignSpecsAndUnits', () => {
    const experimentId = 1
    const treatmentBlocks = [
      { name: '1', treatment_id: 11, id: 111 },
      { name: '2', treatment_id: 22, id: 222 },
    ]
    const designSpecifications = { locations: '1', reps: '2' }

    beforeEach(() => {
      db.locationAssociation.findNumberOfLocationsAssociatedWithSets = mockResolve({ max: 2 })
      target.treatmentBlockService.getTreatmentBlocksByExperimentId = mockResolve(treatmentBlocks)
      target.unitWithBlockService.addTreatmentBlocksToUnits = mock([])
      target.designSpecificationDetailService.saveDesignSpecifications = mockResolve()
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()
      AppError.badRequest = mock()
    })

    test('saves design specifications and empty units', () => {
      const designSpecsAndUnits = {
        designSpecifications,
        units: [],
      }

      return target.saveDesignSpecsAndUnits(experimentId, designSpecsAndUnits, testContext, false, testTx).then(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalledWith(experimentId, testTx)
        expect(target.treatmentBlockService.getTreatmentBlocksByExperimentId).toHaveBeenCalledWith(experimentId, testTx)
        expect(target.saveUnitsByExperimentId).toHaveBeenCalledWith(experimentId, [], false, testContext, testTx)
        expect(target.designSpecificationDetailService.saveDesignSpecifications).toHaveBeenCalledWith(designSpecifications, 1, false, testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    test('saves a list of units', () => {
      const unitsForDB = [{
        rep: 1, treatmentId: 22, block: '2', treatmentBlockId: 222, location: 1,
      }, {
        rep: 1, treatmentId: 11, block: '1', treatmentBlockId: 111, location: 2,
      }]
      target.unitWithBlockService.addTreatmentBlocksToUnits = mock(unitsForDB)
      const designSpecsAndUnits = {
        designSpecifications,
        units: [{
          rep: 1, treatmentId: 22, block: 2, location: 1,
        }, {
          rep: 1, treatmentId: 11, block: 1, location: 2,
        }],
      }

      return target.saveDesignSpecsAndUnits(experimentId, designSpecsAndUnits, testContext, false, testTx).then(() => {
        expect(target.saveUnitsByExperimentId).toHaveBeenCalledWith(experimentId, unitsForDB, false, testContext, testTx)
      })
    })

    test('converts undefined block to null', () => {
      const expectedUnits = [{
        rep: 1, treatmentId: 22, block: null, location: 1,
      }, {
        rep: 1, treatmentId: 11, block: null, location: 2,
      }]
      target.unitWithBlockService.addTreatmentBlocksToUnits = mock()
      const designSpecsAndUnits = {
        designSpecifications,
        units: [{
          rep: 1, treatmentId: 22, block: undefined, location: 1,
        }, {
          rep: 1, treatmentId: 11, block: undefined, location: 2,
        }],
      }

      return target.saveDesignSpecsAndUnits(experimentId, designSpecsAndUnits, testContext, false, testTx).then(() => {
        expect(target.unitWithBlockService.addTreatmentBlocksToUnits).toHaveBeenCalledWith(expectedUnits, treatmentBlocks)
      })
    })

    test('throws an error when treatment block combination is not valid for experiment', () => {
      const unitsForDB = [{
        rep: 1, treatmentId: 22, block: '2', treatmentBlockId: undefined, location: 1,
      }, {
        rep: 1, treatmentId: 11, block: '1', treatmentBlockId: undefined, location: 2,
      }]
      target.unitWithBlockService.addTreatmentBlocksToUnits = mock(unitsForDB)
      const designSpecsAndUnits = {
        designSpecifications,
        units: [{
          rep: 1, treatmentId: 44, block: 2, location: 1,
        }, {
          rep: 1, treatmentId: 11, block: 4, location: 2,
        }],
      }

      return target.saveDesignSpecsAndUnits(experimentId, designSpecsAndUnits, testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('2 units have invalid treatment block values.', undefined, '1FV003')
      })
    })

    test('throws an error when locations are less than set associated with locations', () => {
      const designSpecsAndUnits = {
        designSpecifications,
        units: [{
          rep: 1, treatmentId: 44, block: 2, location: 1,
        }],
      }

      return target.saveDesignSpecsAndUnits(experimentId, designSpecsAndUnits, testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Cannot remove locations from an experiment that are linked to sets', undefined, '1FV002')
      })
    })

    test('rejects when design specification call fails', () => {
      const error = { message: 'error' }
      target.designSpecificationDetailService.saveDesignSpecifications = mockReject(error)
      const designSpecsAndUnits = {
        designSpecifications,
        units: [],
      }

      return target.saveDesignSpecsAndUnits(experimentId, designSpecsAndUnits, testContext, false, testTx).then(() => {}, (err) => {
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('throws a bad request when passed in object is null', () => {
      expect(() => target.saveDesignSpecsAndUnits(experimentId, null, testContext, testTx)).toThrow()
    })
  })

  describe('saveUnitsByExperimentId', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitService()
      target.securityService.permissionsCheck = mockResolve()
      target.compareWithExistingUnitsByExperiment = mockResolve({ adds: [], deletes: [] })
      target.saveComparedUnits = mockResolve()
      return target.saveUnitsByExperimentId(5, [], false, {}, testTx)
        .then(() => {
          expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(5, {}, false, testTx)
          expect(target.compareWithExistingUnitsByExperiment).toHaveBeenCalledWith(5, [], testTx)
          expect(target.saveComparedUnits).toHaveBeenCalledWith(5, { adds: [], deletes: [] }, {}, testTx)
        })
    })
  })

  describe('saveUnitsBySetId', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitService()
      target.compareWithExistingUnitsBySetId = mockResolve({ adds: [], deletes: [] })
      target.saveComparedUnits = mockResolve()
      return target.saveUnitsBySetId(5, 3, [], {}, testTx)
        .then(() => {
          expect(target.compareWithExistingUnitsBySetId).toHaveBeenCalledWith(5, [], testTx)
          expect(target.saveComparedUnits).toHaveBeenCalledWith(3, { adds: [], deletes: [] }, {}, testTx)
        })
    })
  })

  describe('saveComparedUnits', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitService()
      target.createExperimentalUnits = mockResolve()
      target.batchDeleteExperimentalUnits = mockResolve()
      return target.saveComparedUnits(3, { adds: [], deletes: [] }, {}, testTx)
        .then(() => {
          expect(target.createExperimentalUnits).toHaveBeenCalledWith(3, [], {}, testTx)
          expect(target.batchDeleteExperimentalUnits).toHaveBeenCalledWith([], testTx)
        })
    })
  })

  describe('compareWithExistingUnitsByExperiment', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitService()
      target.compareWithExistingUnits = mockResolve([{}])
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ treatment_id: 2 }])
      return target.compareWithExistingUnitsByExperiment(3, [{ treatmentId: 3 }], testTx).then(() => {
        expect(target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate).toHaveBeenCalledWith(3, testTx)
        expect(target.compareWithExistingUnits).toHaveBeenCalledWith([{ treatment_id: 2 }], [{ treatmentId: 3 }])
      })
    })
  })

  describe('compareWithExistingUnitsBySetId', () => {
    test('check functions are called and with correct parameters', () => {
      target = new GroupExperimentalUnitService()
      db.unit.batchFindAllBySetId = mockResolve([{ treatment_id: 2 }])
      target.compareWithExistingUnits = mockResolve([{}])
      return target.compareWithExistingUnitsBySetId(3, [{ treatmentId: 3 }], testTx).then(() => {
        expect(db.unit.batchFindAllBySetId).toHaveBeenCalledWith(3, testTx)
        expect(target.compareWithExistingUnits).toHaveBeenCalledWith([{ treatment_id: 2 }], [{ treatmentId: 3 }])
      })
    })
  })

  describe('compareWithExistingUnits', () => {
    test('existing units from DB contains more units', () => {
      target = new GroupExperimentalUnitService()
      const result = target.compareWithExistingUnits(
        [{ treatment_block_id: 1, rep: 1, location: 3 },
          { treatment_block_id: 2, rep: 1, location: 3 },
          { treatment_block_id: 1, rep: 2, location: 3 },
          { treatment_block_id: 2, rep: 2, location: 3 },
        ],
        [{ treatmentBlockId: 1, rep: 2, location: 3 }],
      )

      expect(result.deletes).toEqual([{ treatmentBlockId: 1, rep: 1, location: 3 },
        { treatmentBlockId: 2, rep: 1, location: 3 },
        { treatmentBlockId: 2, rep: 2, location: 3 }])
      expect(result.adds).toEqual([])
    })

    test('existing units from DB contains less units', () => {
      target = new GroupExperimentalUnitService()
      const result = target.compareWithExistingUnits(
        [{ treatment_block_id: 1, rep: 1, location: 3 }],
        [{ treatmentBlockId: 1, rep: 1, location: 3 },
          { treatmentBlockId: 2, rep: 1, location: 3 },
          { treatmentBlockId: 1, rep: 2, location: 3 },
          { treatmentBlockId: 2, rep: 2, location: 3 }],
      )

      expect(result.adds).toEqual([{ treatmentBlockId: 2, rep: 1, location: 3 },
        { treatmentBlockId: 1, rep: 2, location: 3 },
        { treatmentBlockId: 2, rep: 2, location: 3 }])
      expect(result.deletes).toEqual([])
    })

    test('existing units from DB contains duplicate treatment in rep', () => {
      target = new GroupExperimentalUnitService()
      const result = target.compareWithExistingUnits(
        [{ treatment_block_id: 1, rep: 1, location: 3 },
          { treatment_block_id: 2, rep: 1, location: 3 },
          { treatment_block_id: 1, rep: 2, location: 3 },
          { treatmentBlockId: 1, rep: 2, location: 3 },
          { treatment_block_id: 2, rep: 2, location: 3 },
        ],
        [{ treatmentBlockId: 1, rep: 2, location: 3 }],
      )

      expect(result.deletes).toEqual([{ treatmentBlockId: 1, rep: 1, location: 3 },
        { treatmentBlockId: 2, rep: 1, location: 3 },
        { treatmentBlockId: 1, rep: 2, location: 3 },
        { treatmentBlockId: 2, rep: 2, location: 3 }])
      expect(result.adds).toEqual([])
    })
  })
})
