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
      db.treatment.getDistinctExperimentIds = mockResolve()
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve()

      return target.createExperimentalUnits(1, [], testContext, testTx).then((data) => {
        expect(db.treatment.getDistinctExperimentIds).not.toBeCalled()
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toBeCalled()
        expect(data).toEqual(undefined)
      })
    })

    test('batch creates experimental units', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then((data) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).toHaveBeenCalledWith([{ treatmentId: 1 }], testContext, testTx)
        expect(data).toEqual([1])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockReject(error)

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, (err) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).toHaveBeenCalledWith([{ treatmentId: 1 }], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getDistinctExperimentIds fails', () => {
      const error = { message: 'error' }
      db.treatment.getDistinctExperimentIds = mockReject(error)
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, (err) => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('throws an error when there are multiple experiment ids returned', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 1 }, { experiment_id: 2 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])
      AppError.badRequest = mock()

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, () => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatments not associated with same experiment', undefined, '1FA001')
      })
    })

    test('throws an error when there are returned distinct experiment id does not match passed in', () => {
      db.treatment.getDistinctExperimentIds = mockResolve([{ experiment_id: 2 }])
      target.experimentalUnitService.batchCreateExperimentalUnits = mockResolve([1])
      AppError.badRequest = mock()

      return target.createExperimentalUnits(1, [{ treatmentId: 1 }], testContext, testTx).then(() => {}, () => {
        expect(db.treatment.getDistinctExperimentIds).toHaveBeenCalledWith([1], testTx)
        expect(target.experimentalUnitService.batchCreateExperimentalUnits).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Treatments not associated with same experiment', undefined, '1FA001')
      })
    })
  })

  describe('resetSet', () => {
    test('calls all the correct services', () => {
      const header = ['header']
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 2,
        numberOfReps: 5,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1 }, { id: 2 }])
      db.unit.batchFindAllByExperimentIdLocationAndBlock = mockResolve([{
        location: 2, rep: 1, treatment_id: 1, id: 101,
      },
      {
        location: 2, rep: 1, treatment_id: 2, id: 102,
      },
      {
        location: 2, rep: 2, treatment_id: 1, id: 103,
      },
      {
        location: 2, rep: 2, treatment_id: 2, id: 104,
      },
      {
        location: 2, rep: 3, treatment_id: 1, id: 105,
      },
      {
        location: 2, rep: 3, treatment_id: 2, id: 106,
      },
      {
        location: 2, rep: 4, treatment_id: 1, id: 107,
      },
      {
        location: 2, rep: 4, treatment_id: 2, id: 108,
      },
      {
        location: 2, rep: 5, treatment_id: 1, id: 109,
      },
      {
        location: 2, rep: 5, treatment_id: 2, id: 110,
      }])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve(header)
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [{}, {}, {}, {}] } })
      HttpUtil.delete = mockResolve()
      HttpUtil.patch = mockResolve({ body: { entries: [{ entryId: 1001 }, { entryId: 1002 }, { entryId: 1003 }, { entryId: 1004 }, { entryId: 1005 }, { entryId: 1006 }, { entryId: 1007 }, { entryId: 1008 }, { entryId: 1009 }, { entryId: 1000 }] } })
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockResolve()

      return target.resetSet(5, {}, testTx).then(() => {
        expect(target.verifySetAndGetDetails).toBeCalledWith(5, {}, testTx)
        expect(db.treatment.findAllByExperimentId).toBeCalledWith(3, testTx)
        expect(PingUtil.getMonsantoHeader).toBeCalledWith()
        expect(HttpUtil.getWithRetry).toBeCalledWith('testUrl/sets/5?entries=true', header)
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}], layout: [] })
        expect(target.experimentalUnitService.batchPartialUpdateExperimentalUnits).toBeCalledWith([{
          id: 101, location: 2, rep: 1, treatmentId: 1, setEntryId: 1001,
        },
        {
          id: 102, location: 2, rep: 1, treatmentId: 2, setEntryId: 1002,
        },
        {
          id: 103, location: 2, rep: 2, treatmentId: 1, setEntryId: 1003,
        },
        {
          id: 104, location: 2, rep: 2, treatmentId: 2, setEntryId: 1004,
        },
        {
          id: 105, location: 2, rep: 3, treatmentId: 1, setEntryId: 1005,
        },
        {
          id: 106, location: 2, rep: 3, treatmentId: 2, setEntryId: 1006,
        },
        {
          id: 107, location: 2, rep: 4, treatmentId: 1, setEntryId: 1007,
        },
        {
          id: 108, location: 2, rep: 4, treatmentId: 2, setEntryId: 1008,
        },
        {
          id: 109, location: 2, rep: 5, treatmentId: 1, setEntryId: 1009,
        },
        {
          id: 110, location: 2, rep: 5, treatmentId: 2, setEntryId: 1000,
        }], {}, testTx)
      })
    })

    test('calls only the sets services it needs to', () => {
      const header = ['header']
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 1,
        numberOfReps: 5,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1 }, { id: 2 }])
      db.unit.batchFindAllByExperimentIdLocationAndBlock = mockResolve([{
        location: 1, rep: 1, treatment_id: 1, id: 101,
      },
      {
        location: 1, rep: 1, treatment_id: 2, id: 102,
      },
      {
        location: 1, rep: 2, treatment_id: 1, id: 103,
      },
      {
        location: 1, rep: 2, treatment_id: 2, id: 104,
      },
      {
        location: 1, rep: 3, treatment_id: 1, id: 105,
      },
      {
        location: 1, rep: 3, treatment_id: 2, id: 106,
      },
      {
        location: 1, rep: 4, treatment_id: 1, id: 107,
      },
      {
        location: 1, rep: 4, treatment_id: 2, id: 108,
      },
      {
        location: 1, rep: 5, treatment_id: 1, id: 109,
      },
      {
        location: 1, rep: 5, treatment_id: 2, id: 110,
      }])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve(header)
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [] } })
      HttpUtil.delete = mockResolve()
      HttpUtil.patch = mockResolve({ body: { entries: [{ entryId: 1001 }, { entryId: 1002 }, { entryId: 1003 }, { entryId: 1004 }, { entryId: 1005 }, { entryId: 1006 }, { entryId: 1007 }, { entryId: 1008 }, { entryId: 1009 }, { entryId: 1000 }] } })
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockResolve()

      return target.resetSet(5, {}, testTx).then(() => {
        expect(target.verifySetAndGetDetails).toBeCalledWith(5, {}, testTx)
        expect(db.treatment.findAllByExperimentId).toBeCalledWith(3, testTx)
        expect(PingUtil.getMonsantoHeader).toBeCalledWith()
        expect(HttpUtil.getWithRetry).toBeCalledWith('testUrl/sets/5?entries=true', header)
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}], layout: [] })
        expect(HttpUtil.patch).toHaveBeenCalledTimes(1)
        expect(target.experimentalUnitService.batchPartialUpdateExperimentalUnits).toBeCalledWith([{
          location: 1, rep: 1, treatmentId: 1, setEntryId: 1001, id: 101,
        },
        {
          location: 1, rep: 1, treatmentId: 2, setEntryId: 1002, id: 102,
        },
        {
          location: 1, rep: 2, treatmentId: 1, setEntryId: 1003, id: 103,
        },
        {
          location: 1, rep: 2, treatmentId: 2, setEntryId: 1004, id: 104,
        },
        {
          location: 1, rep: 3, treatmentId: 1, setEntryId: 1005, id: 105,
        },
        {
          location: 1, rep: 3, treatmentId: 2, setEntryId: 1006, id: 106,
        },
        {
          location: 1, rep: 4, treatmentId: 1, setEntryId: 1007, id: 107,
        },
        {
          location: 1, rep: 4, treatmentId: 2, setEntryId: 1008, id: 108,
        },
        {
          location: 1, rep: 5, treatmentId: 1, setEntryId: 1009, id: 109,
        },
        {
          location: 1, rep: 5, treatmentId: 2, setEntryId: 1000, id: 110,
        }], {}, testTx)
      })
    })

    test('calls only the sets services it needs to with blocking', () => {
      const header = ['header']
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 1,
        numberOfReps: 2,
        block: 2,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1, block: 1 }, { id: 2, block: 2 }, { id: 3, in_all_blocks: true }])
      db.unit.batchFindAllByExperimentIdLocationAndBlock = mockResolve([
        {
          location: 1, rep: 1, treatment_id: 2, id: 102, block: 2,
        },
        {
          location: 1, rep: 1, treatment_id: 3, id: 104, block: 2,
        },
        {
          location: 1, rep: 2, treatment_id: 2, id: 106, block: 2,
        },
        {
          location: 1, rep: 2, treatment_id: 3, id: 108, block: 2,
        },
      ])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve(header)
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [] } })
      HttpUtil.delete = mockResolve()
      HttpUtil.patch = mockResolve({ body: { entries: [{ entryId: 1001 }, { entryId: 1002 }, { entryId: 1003 }, { entryId: 1004 }, { entryId: 1005 }, { entryId: 1006 }, { entryId: 1007 }, { entryId: 1008 }] } })
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockResolve()

      return target.resetSet(5, {}, testTx).then(() => {
        expect(target.verifySetAndGetDetails).toBeCalledWith(5, {}, testTx)
        expect(db.treatment.findAllByExperimentId).toBeCalledWith(3, testTx)
        expect(PingUtil.getMonsantoHeader).toBeCalledWith()
        expect(HttpUtil.getWithRetry).toBeCalledWith('testUrl/sets/5?entries=true', header)
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}], layout: [] })
        expect(HttpUtil.patch).toHaveBeenCalledTimes(1)
        expect(target.experimentalUnitService.batchPartialUpdateExperimentalUnits).toBeCalledWith([
          {
            location: 1, rep: 1, treatmentId: 2, setEntryId: 1001, id: 102, block: 2,
          },
          {
            location: 1, rep: 1, treatmentId: 3, setEntryId: 1002, id: 104, block: 2,
          },
          {
            location: 1, rep: 2, treatmentId: 2, setEntryId: 1003, id: 106, block: 2,
          },
          {
            location: 1, rep: 2, treatmentId: 3, setEntryId: 1004, id: 108, block: 2,
          },
        ], {}, testTx)
      })
    })

    test('sends the correct error and code back when sets error occurs', (done) => {
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 1,
        numberOfReps: 5,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1 }, { id: 2 }])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockReject({ response: { error: {} } })
      AppError.internalServerError = mock()

      return target.resetSet(5, {}, testTx).catch(() => {
        expect(AppError.internalServerError).toBeCalledWith('An error occurred while communicating with the sets service.', undefined, '1Fd001')
        done()
      })
    })

    test('does not send sets error when error occurs while saving setEntryIds', (done) => {
      const header = ['header']
      cfServices.experimentsExternalAPIUrls = {
        value: {
          setsAPIUrl: 'testUrl',
        },
      }
      target.verifySetAndGetDetails = mockResolve({
        experimentId: 3,
        location: 1,
        numberOfReps: 5,
      })
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1 }, { id: 2 }])
      db.unit.batchFindAllByExperimentIdLocationAndBlock = mockResolve([{
        location: 1, rep: 1, treatment_id: 1, id: 101, setEntryId: 1001,
      },
      {
        location: 1, rep: 1, treatment_id: 2, id: 102, setEntryId: 1002,
      },
      {
        location: 1, rep: 2, treatment_id: 1, id: 103, setEntryId: 1003,
      },
      {
        location: 1, rep: 2, treatment_id: 2, id: 104, setEntryId: 1004,
      },
      {
        location: 1, rep: 3, treatment_id: 1, id: 105, setEntryId: 1005,
      },
      {
        location: 1, rep: 3, treatment_id: 2, id: 106, setEntryId: 1006,
      },
      {
        location: 1, rep: 4, treatment_id: 1, id: 107, setEntryId: 1007,
      },
      {
        location: 1, rep: 4, treatment_id: 2, id: 108, setEntryId: 1008,
      },
      {
        location: 1, rep: 5, treatment_id: 1, id: 109, setEntryId: 1009,
      },
      {
        location: 1, rep: 5, treatment_id: 2, id: 110, setEntryId: 1000,
      }])
      target.saveUnitsBySetId = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve(header)
      HttpUtil.getWithRetry = mockResolve({ body: { entries: [{ entryId: 1 }, { entryId: 2 }, { entryId: 3 }, { entryId: 4 }] } })
      HttpUtil.delete = mockResolve()
      HttpUtil.patch = mockResolve({ body: { entries: [{ entryId: 1001 }, { entryId: 1002 }, { entryId: 1003 }, { entryId: 1004 }, { entryId: 1005 }, { entryId: 1006 }, { entryId: 1007 }, { entryId: 1008 }, { entryId: 1009 }, { entryId: 1000 }] } })
      target.experimentalUnitService.batchPartialUpdateExperimentalUnits = mockReject()
      AppError.internalServerError = mock()

      return target.resetSet(5, {}, testTx).catch(() => {
        expect(target.verifySetAndGetDetails).toBeCalledWith(5, {}, testTx)
        expect(db.treatment.findAllByExperimentId).toBeCalledWith(3, testTx)
        expect(PingUtil.getMonsantoHeader).toBeCalledWith()
        expect(HttpUtil.getWithRetry).toBeCalledWith('testUrl/sets/5?entries=true', header)
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}], layout: [] })
        expect(HttpUtil.patch).toBeCalledWith('testUrl/sets/5', header, { entries: [{ entryId: 1, deleted: true }, { entryId: 2, deleted: true }, { entryId: 3, deleted: true }, { entryId: 4, deleted: true }] })
        expect(target.experimentalUnitService.batchPartialUpdateExperimentalUnits).toBeCalledWith([{
          location: 1, rep: 1, treatmentId: 1, setEntryId: 1001, id: 101,
        },
        {
          location: 1, rep: 1, treatmentId: 2, setEntryId: 1002, id: 102,
        },
        {
          location: 1, rep: 2, treatmentId: 1, setEntryId: 1003, id: 103,
        },
        {
          location: 1, rep: 2, treatmentId: 2, setEntryId: 1004, id: 104,
        },
        {
          location: 1, rep: 3, treatmentId: 1, setEntryId: 1005, id: 105,
        },
        {
          location: 1, rep: 3, treatmentId: 2, setEntryId: 1006, id: 106,
        },
        {
          location: 1, rep: 4, treatmentId: 1, setEntryId: 1007, id: 107,
        },
        {
          location: 1, rep: 4, treatmentId: 2, setEntryId: 1008, id: 108,
        },
        {
          location: 1, rep: 5, treatmentId: 1, setEntryId: 1009, id: 109,
        },
        {
          location: 1, rep: 5, treatmentId: 2, setEntryId: 1000, id: 110,
        }], {}, testTx)

        expect(AppError.internalServerError).not.toBeCalled()
        done()
      })
    })
  })

  describe('verifySetAndGetDetails', () => {
    test('returns the expected data', () => {
      db.locationAssociation.findBySetId = mockResolve({ location: 1, experiment_id: 5, set_id: 3 })
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{ ref_design_spec_id: 12, value: 2 }])
      db.refDesignSpecification.all = mockResolve([{ id: 12, name: 'Reps' }, { id: 11, name: 'Min Rep' }, { id: 13, name: 'Locations' }])

      return target.verifySetAndGetDetails(3, {}, testTx).then((result) => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(3, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalledWith(5, testTx)
        expect(db.refDesignSpecification.all).toBeCalledWith()

        expect(result).toEqual({
          experimentId: 5,
          location: 1,
          numberOfReps: 2,
        })
      })
    })

    test('throws correct error when set is not found', (done) => {
      db.locationAssociation.findBySetId = mockResolve()
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{ ref_design_spec_id: 12, value: 2 }])
      AppError.notFound = mock()

      return target.verifySetAndGetDetails(3, {}, testTx).catch(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(3, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).not.toBeCalled()
        expect(AppError.notFound).toBeCalledWith('No set found for id 3', undefined, '1FK001')

        done()
      })
    })

    test('throws correct error when number of reps not found', (done) => {
      db.locationAssociation.findBySetId = mockResolve({ location: 1, experiment_id: 5, set_id: 3 })
      db.designSpecificationDetail = { findAllByExperimentId: mockResolve([{ ref_design_spec_id: 13, value: 2 }]) }
      db.refDesignSpecification = { all: mockResolve([{ id: 12, name: 'Reps' }, { id: 11, name: 'Min Rep' }, { id: 13, name: 'Locations' }]) }
      AppError.badRequest = mock()

      return target.verifySetAndGetDetails(3, {}, testTx).catch(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(3, testTx)
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
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { items: [{}] } }, { id: 5, factor_id: 1, value: { items: [{}, {}] } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.treatment.findAllByExperimentId = mockResolve([{ id: 7, block: null }])
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 }])
      db.unit.findAllByExperimentId = mockResolve([{ location: 1, block: null }])
      db.locationAssociation.findByExperimentId = mockResolve('setIds')
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
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.treatment.findAllByExperimentId).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(db.unit.findAllByExperimentId).toBeCalled()
        expect(db.locationAssociation.findByExperimentId).toBeCalled()
        expect(db.experiments.findExperimentOrTemplate).toHaveBeenCalled()
        expect(AWSUtil.callLambda).toBeCalledWith('cosmos-group-generation-lambda-dev', JSON.stringify(expectedLambdaPayload))
        expect(AppError.internalServerError).not.toBeCalled()
        expect(data).toContainEqual({ test: 'message' })
        expect(target.lambdaPerformanceService.savePerformanceStats).toBeCalled()
      })
    })

    test('properly handles lambda errors', () => {
      target = new GroupExperimentalUnitService()
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.treatment.findAllByExperimentId = mockResolve([{ id: 7, block: null }])
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 }])
      db.unit.findAllByExperimentId = mockResolve('units')
      db.locationAssociation.findByExperimentId = mockResolve('setIds')
      db.experiments.findExperimentOrTemplate = mockResolve({ randomizationStrategyCode: 'rcb' })
      AWSUtil.callLambda = mockReject()
      AppError.internalServerError = mock({ message: 'error result' })
      target.lambdaPerformanceService.savePerformanceStats = mockResolve()

      return target.getGroupsAndUnits(5, testTx).catch(() => {
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.treatment.findAllByExperimentId).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(db.unit.findAllByExperimentId).toBeCalled()
        expect(db.locationAssociation.findByExperimentId).toBeCalled()
        expect(db.experiments.findExperimentOrTemplate).toHaveBeenCalled()
        expect(AWSUtil.callLambda).toBeCalled()
        expect(AppError.internalServerError).toBeCalledWith('An error occurred while generating groups.', undefined, '1FO001')
        expect(target.lambdaPerformanceService.savePerformanceStats).not.toBeCalled()
      })
    })

    test('test multiple locations and lambda are called multiple times', () => {
      target = new GroupExperimentalUnitService()
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { items: [{}] } }, { id: 5, factor_id: 1, value: { items: [{}, {}] } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.treatment.findAllByExperimentId = mockResolve([{ id: 7, block: null }])
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 }])
      db.unit.findAllByExperimentId = mockResolve([{ location: 1, block: null }, { location: 2, block: null }])
      db.locationAssociation.findByExperimentId = mockResolve('setIds')
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
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.treatment.findAllByExperimentId).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(db.unit.findAllByExperimentId).toBeCalled()
        expect(db.locationAssociation.findByExperimentId).toBeCalled()
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
      db.factor.findByExperimentId = mockResolve([{ id: 1, name: 'var1' }])
      db.factorLevel.findByExperimentId = mockResolve([{ id: 3, factor_id: 1, value: { items: [{}] } }, { id: 5, factor_id: 1, value: { items: [{}, {}] } }])
      db.designSpecificationDetail.findAllByExperimentId = mockResolve('designSpecs')
      db.refDesignSpecification.all = mockResolve('refDesignSpecs')
      db.treatment.findAllByExperimentId = mockResolve([{ id: 7, block: 3 }, { id: 8, in_all_blocks: true }])
      db.combinationElement.findAllByExperimentId = mockResolve([{ treatment_id: 7, factor_level_id: 3 }, { treatment_id: 7, factor_level_id: 5 },
        { treatment_id: 8, factor_level_id: 4 }, { treatment_id: 8, factor_level_id: 6 }])
      db.unit.findAllByExperimentId = mockResolve([{ location: 1, block: 3 }, { location: 2, block: 1 }])
      db.locationAssociation.findByExperimentId = mockResolve('setIds')
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
        expect(db.factor.findByExperimentId).toBeCalled()
        expect(db.factorLevel.findByExperimentId).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(db.treatment.findAllByExperimentId).toBeCalled()
        expect(db.combinationElement.findAllByExperimentId).toBeCalled()
        expect(db.unit.findAllByExperimentId).toBeCalled()
        expect(db.locationAssociation.findByExperimentId).toBeCalled()
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
      db.locationAssociation.findBySetId = mockResolve({ set_id: 4871, experiment_id: 112, location: 1 })
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
      db.locationAssociation.findBySetId = mockResolve({ set_id: 4871, experiment_id: 112, location: 1 })
      target.getGroupAndUnitsBySetIdAndExperimentId = mockResolve({})
      return target.getGroupAndUnitsBySetId(4871, testTx).then((group) => {
        expect(target.getGroupAndUnitsBySetIdAndExperimentId).toHaveBeenCalled()
        expect(group).toEqual({})
      })
    })

    test('getting a group and units with an empty return of the db query', () => {
      target = new GroupExperimentalUnitService()
      db.locationAssociation.findBySetId = mockResolve(null)
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
      db.locationAssociation.findBySetId = mockReject('error')
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
    test('saves design specifications and units', () => {
      target.designSpecificationDetailService = {
        saveDesignSpecifications: mockResolve(),
      }
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndUnits = {
        designSpecifications: [],
        units: [],
      }
      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ max: 3 }),
      }

      return target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, false, testTx).then(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(target.saveUnitsByExperimentId).toHaveBeenCalledWith(1, [], false, testContext, testTx)
        expect(target.designSpecificationDetailService.saveDesignSpecifications).toHaveBeenCalledWith([], 1, false, testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    test('throws and error when locations are less than set associated with locations', () => {
      target.designSpecificationDetailService = {
        saveDesignSpecifications: mockResolve(),
      }
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndUnits = {
        designSpecifications: [],
        units: [{ location: 1 }, { location: 2 }],
      }
      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ max: 3 }),
      }
      AppError.badRequest = mock()

      return target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, false, testTx).catch(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalled()
      })
    })

    test('rejects when design specification call fails', () => {
      const error = { message: 'error' }
      target.designSpecificationDetailService = {
        saveDesignSpecifications: mockReject(error),
      }
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndUnits = {
        designSpecifications: [],
        units: [],
      }

      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ max: 3 }),
      }

      return target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, false, testTx).then(() => {}, (err) => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(target.saveUnitsByExperimentId).toHaveBeenCalledWith(1, [], false, testContext, testTx)
        expect(target.designSpecificationDetailService.saveDesignSpecifications).toHaveBeenCalledWith([], 1, false, testContext, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('throws a bad request when passed in object is null', () => {
      AppError.badRequest = mock('')

      const designSpecsAndUnits = null
      expect(() => target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, testTx)).toThrow()
    })

    test('rejects when a unit has a block value that does not match its treatment', () => {
      target.designSpecificationDetailService = {
        saveDesignSpecifications: mockResolve(),
      }
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndUnits = {
        designSpecifications: [],
        units: [{ location: 1, treatmentId: 1, block: 1 }, { location: 2, treatmentId: 1, block: 2 }],
      }
      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ max: 2 }),
      }
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1, block: 1 }])
      AppError.badRequest = mock()

      return target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, false, testTx).catch(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalled()
      })
    })

    test('rejects when a unit has a block value that is outside those on the treatments', () => {
      target.designSpecificationDetailService = {
        saveDesignSpecifications: mockResolve(),
      }
      target.saveUnitsByExperimentId = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      const designSpecsAndUnits = {
        designSpecifications: [],
        units: [{ location: 1, treatmentId: 1, block: 1 }, { location: 2, treatmentId: 3, block: 2 }, { location: 2, treatmentId: 3 }],
      }
      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ max: 2 }),
      }
      db.treatment.findAllByExperimentId = mockResolve([{ id: 1, block: 1 }, { id: 2, block: 3 }, { id: 3, in_all_blocks: true }])
      AppError.badRequest = mock()

      return target.saveDesignSpecsAndUnits(1, designSpecsAndUnits, testContext, false, testTx).catch(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalled()
      })
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
        [{ treatment_id: 1, rep: 1, location: 3 },
          { treatment_id: 2, rep: 1, location: 3 },
          { treatment_id: 1, rep: 2, location: 3 },
          { treatment_id: 2, rep: 2, location: 3 },
        ],
        [{ treatmentId: 1, rep: 2, location: 3 }],
      )

      expect(result.deletes).toEqual([{ treatmentId: 1, rep: 1, location: 3 },
        { treatmentId: 2, rep: 1, location: 3 },
        { treatmentId: 2, rep: 2, location: 3 }])
      expect(result.adds).toEqual([])
    })

    test('existing units from DB contains less units', () => {
      target = new GroupExperimentalUnitService()
      const result = target.compareWithExistingUnits(
        [{ treatment_id: 1, rep: 1, location: 3 }],
        [{ treatmentId: 1, rep: 1, location: 3 },
          { treatmentId: 2, rep: 1, location: 3 },
          { treatmentId: 1, rep: 2, location: 3 },
          { treatmentId: 2, rep: 2, location: 3 }],
      )

      expect(result.adds).toEqual([{ treatmentId: 2, rep: 1, location: 3 },
        { treatmentId: 1, rep: 2, location: 3 },
        { treatmentId: 2, rep: 2, location: 3 }])
      expect(result.deletes).toEqual([])
    })

    test('existing units from DB contains duplicate treatment in rep', () => {
      target = new GroupExperimentalUnitService()
      const result = target.compareWithExistingUnits(
        [{ treatment_id: 1, rep: 1, location: 3 },
          { treatment_id: 2, rep: 1, location: 3 },
          { treatment_id: 1, rep: 2, location: 3 },
          { treatmentId: 1, rep: 2, location: 3 },
          { treatment_id: 2, rep: 2, location: 3 },
        ],
        [{ treatmentId: 1, rep: 2, location: 3 }],
      )

      expect(result.deletes).toEqual([{ treatmentId: 1, rep: 1, location: 3 },
        { treatmentId: 2, rep: 1, location: 3 },
        { treatmentId: 1, rep: 2, location: 3 },
        { treatmentId: 2, rep: 2, location: 3 }])
      expect(result.adds).toEqual([])
    })
  })
})
