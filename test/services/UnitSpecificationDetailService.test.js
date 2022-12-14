import {
  kafkaProducerMocker, mock, mockReject, mockResolve,
} from '../jestUtil'
import UnitSpecificationDetailService from '../../src/services/UnitSpecificationDetailService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('UnitSpecificationDetailService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  kafkaProducerMocker()

  beforeEach(() => {
    target = new UnitSpecificationDetailService()
  })

  describe('getUnitSpecificationDetailsByExperimentId', () => {
    test('gets unit specification details', () => {
      target.experimentService.getExperimentById = mockResolve()
      dbRead.unitSpecificationDetail.findAllByExperimentId = mockResolve([{}])

      return target.getUnitSpecificationDetailsByExperimentId(1, false, testContext).then((data) => {
        expect(dbRead.unitSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([{}])
      })
    })

    test('rejects when findAllByExperimentId fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockResolve()
      dbRead.unitSpecificationDetail.findAllByExperimentId = mockReject(error)

      return target.getUnitSpecificationDetailsByExperimentId(1, false, testContext).then(() => {}, (err) => {
        expect(dbRead.unitSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      dbRead.unitSpecificationDetail.findAllByExperimentId = mock()

      return target.getUnitSpecificationDetailsByExperimentId(1, false, testContext).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext)
        expect(dbRead.unitSpecificationDetail.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchCreateUnitSpecificationDetails', () => {
    test('creates unit specification details', () => {
      target.validator.validate = mockResolve()
      dbWrite.unitSpecificationDetail.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()
      target.backfillUnitSpecificationRecord = mock()

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.unitSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      const error = { message: 'error' }
      dbWrite.unitSpecificationDetail.batchCreate = mockReject(error)
      target.backfillUnitSpecificationRecord = mock()

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.unitSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.unitSpecificationDetail.batchCreate = mockReject(error)
      target.backfillUnitSpecificationRecord = mock()

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.unitSpecificationDetail.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchUpdateUnitSpecificationDetails', () => {
    test('updates unit specification details', () => {
      target.validator.validate = mockResolve()
      dbWrite.unitSpecificationDetail.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()
      target.backfillUnitSpecificationRecord = mock()

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.unitSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      const error = { message: 'error' }
      dbWrite.unitSpecificationDetail.batchUpdate = mockReject(error)
      target.backfillUnitSpecificationRecord = mock()

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.unitSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.unitSpecificationDetail.batchUpdate = mockReject(error)
      target.backfillUnitSpecificationRecord = mock()

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.unitSpecificationDetail.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('backfillUnitSpecificationRecord', () => {
    test('correctly maps values', () => {
      target = new UnitSpecificationDetailService()
      const data = [{ uomCode: 'm' }, { uomCode: 'bad value' }, { uomCode: 'in' }, { uomCode: 'ft' }, { uomCode: 'cm' }]

      target.backfillUnitSpecificationRecord(data)

      expect(data[0].uomId).toBe(3)
      expect(data[1].uomId).toBe(undefined)
      expect(data[2].uomId).toBe(2)
      expect(data[3].uomId).toBe(1)
      expect(data[4].uomId).toBe(4)
    })
  })

  describe('manageAllUnitSpecificationDetails', () => {
    test('manages delete, update, and create unit specification details call', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.deleteUnitSpecificationDetails = mockResolve()
      target.updateUnitSpecificationDetails = mockResolve()
      target.createUnitSpecificationDetails = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllUnitSpecificationDetails('-1', {
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, false, testTx).then(() => {
        expect(target.deleteUnitSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateUnitSpecificationDetails).toHaveBeenCalledWith([{ experimentId: -1 }], testContext, testTx)
        expect(target.createUnitSpecificationDetails).toHaveBeenCalledWith([{ experimentId: -1 }, { experimentId: -1 }], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    test('rejects when create fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.deleteUnitSpecificationDetails = mockResolve()
      target.updateUnitSpecificationDetails = mockResolve()
      const error = { message: 'error' }
      target.createUnitSpecificationDetails = mockReject(error)
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllUnitSpecificationDetails(-1, {
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.deleteUnitSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateUnitSpecificationDetails).toHaveBeenCalledWith([{ experimentId: -1 }], testContext, testTx)
        expect(target.createUnitSpecificationDetails).toHaveBeenCalledWith([{ experimentId: -1 }, { experimentId: -1 }], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when update fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.deleteUnitSpecificationDetails = mockResolve()
      const error = { message: 'error' }
      target.updateUnitSpecificationDetails = mockReject(error)
      target.createUnitSpecificationDetails = mockReject(error)
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllUnitSpecificationDetails(-1, {
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.deleteUnitSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateUnitSpecificationDetails).toHaveBeenCalledWith([{ experimentId: -1 }], testContext, testTx)
        expect(target.createUnitSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when delete fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      const error = { message: 'error' }
      target.deleteUnitSpecificationDetails = mockReject(error)
      target.updateUnitSpecificationDetails = mockReject(error)
      target.createUnitSpecificationDetails = mockReject(error)
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllUnitSpecificationDetails(-1, {
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.deleteUnitSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateUnitSpecificationDetails).not.toHaveBeenCalled()
        expect(target.createUnitSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('deleteUnitSpecificationDetails', () => {
    test('deletes unit specification details', () => {
      dbWrite.unitSpecificationDetail.batchRemove = mockResolve([1])
      return target.deleteUnitSpecificationDetails([1], testContext, testTx).then((data) => {
        expect(dbWrite.unitSpecificationDetail.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    test('resolves when no ids are passed in for delete', () => {
      dbWrite.unitSpecificationDetail.batchRemove = mock()
      return target.deleteUnitSpecificationDetails([], testContext, testTx).then(() => {
        expect(dbWrite.unitSpecificationDetail.batchRemove).not.toHaveBeenCalled()
      })
    })

    test('throws an error when not all unit specification details are found for delete', () => {
      dbWrite.unitSpecificationDetail.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.deleteUnitSpecificationDetails([1, 2], testContext, testTx).then(() => {}, () => {
        expect(dbWrite.unitSpecificationDetail.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all unit specification detail ids requested for delete were found', undefined, '1S6001')
      })
    })
  })

  describe('updateUnitSpecificationDetails', () => {
    test('updates unit specification details', () => {
      target.batchUpdateUnitSpecificationDetails = mockResolve([{}])

      return target.updateUnitSpecificationDetails([{ experimentId: 1 }], testContext, testTx).then((data) => {
        expect(target.batchUpdateUnitSpecificationDetails).toHaveBeenCalledWith([{ experimentId: 1 }], testContext, testTx)
        expect(data).toEqual([{}])
      })
    })

    test('does not update units when none are passed in', () => {
      target.batchUpdateUnitSpecificationDetails = mock()

      return target.updateUnitSpecificationDetails([], testTx).then(() => {
        expect(target.batchUpdateUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })
  })

  describe('createUnitSpecificationDetails', () => {
    test('creates unit specification details', () => {
      target.batchCreateUnitSpecificationDetails = mockResolve([{}])

      return target.createUnitSpecificationDetails([{ experimentId: 1 }], testContext, testTx).then((data) => {
        expect(target.batchCreateUnitSpecificationDetails).toHaveBeenCalledWith([{ experimentId: 1 }], testContext, testTx)
        expect(data).toEqual([{}])
      })
    })

    test('does not create unit specification details', () => {
      target.batchCreateUnitSpecificationDetails = mock()

      return target.createUnitSpecificationDetails([], testTx).then(() => {
        expect(target.batchCreateUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })
  })

  describe('syncUnitSpecificationDetails', () => {
    test('returns a resolved promise when there are no unit specification details to sync', () => {
      target = new UnitSpecificationDetailService()
      target.getUnitSpecificationDetailsByExperimentId = mockResolve([])
      target.unitSpecificationService = {
        getAllUnitSpecifications: mockResolve([]),
      }
      dbWrite.unitSpecificationDetail.syncUnitSpecificationDetails = mock()

      return target.syncUnitSpecificationDetails({}, 1, testContext, testTx).then(() => {
        expect(dbWrite.unitSpecificationDetail.syncUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })

    test('rejects when it fails to get unit specifications', () => {
      target = new UnitSpecificationDetailService()
      target.getUnitSpecificationDetailsByExperimentId = mockResolve([])
      target.unitSpecificationService = {
        getAllUnitSpecifications: mockReject(),
      }
      dbWrite.unitSpecificationDetail.syncUnitSpecificationDetails = mock()

      return target.syncUnitSpecificationDetails({}, 1, testContext, testTx).then(() => {}, () => {
        expect(dbWrite.unitSpecificationDetail.syncUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })

    test('rejects when it fails to get unit specification details', () => {
      target = new UnitSpecificationDetailService()
      target.getUnitSpecificationDetailsByExperimentId = mockResolve([])
      target.unitSpecificationService = {
        getAllUnitSpecifications: mockReject(),
      }
      dbWrite.unitSpecificationDetail.syncUnitSpecificationDetails = mockResolve()

      return target.syncUnitSpecificationDetails({}, 1, testContext, testTx).then(() => {}, () => {
        expect(dbWrite.unitSpecificationDetail.syncUnitSpecificationDetails).not.toHaveBeenCalled()
        expect(target.unitSpecificationService.getAllUnitSpecifications).toHaveBeenCalled()
      })
    })

    test('adds a rows per plot and row spacing unit for upsert', () => {
      target = new UnitSpecificationDetailService()
      target.getUnitSpecificationDetailsByExperimentId = mockResolve([
        { id: 1, ref_unit_spec_id: 1, value: '1' },
        { id: 2, ref_unit_spec_id: 3, value: '8' },
      ])
      target.manageAllUnitSpecificationDetails = mock()
      target.unitSpecificationService = {
        getAllUnitSpecifications: mockResolve([{ id: 1, name: 'Number of Rows' },
          { id: 2, name: 'Row Spacing' }, { id: 3, name: 'Row Length' }]),
      }
      dbWrite.unitSpecificationDetail.batchRemove = mockResolve()
      dbWrite.unitSpecificationDetail.batchCreate = mockResolve()

      const capacityRequestUnitSpecificationDetails = {
        'number of rows': 5,
        'row spacing': 4,
        'row spacing uom': 2,
        'row length': 6,
        'plot row length uom': 3,
      }

      return target.syncUnitSpecificationDetails(capacityRequestUnitSpecificationDetails, 1, testContext, testTx).then(() => {
        expect(dbWrite.unitSpecificationDetail.batchCreate).toHaveBeenCalled()
      })
    })
  })
})
