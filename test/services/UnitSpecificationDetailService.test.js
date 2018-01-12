import { mock, mockReject, mockResolve } from '../jestUtil'
import UnitSpecificationDetailService from '../../src/services/UnitSpecificationDetailService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'

describe('UnitSpecificationDetailService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new UnitSpecificationDetailService()
  })

  describe('getUnitSpecificationDetailsByExperimentId', () => {
    test('gets unit specification details', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.unitSpecificationDetail.findAllByExperimentId = mockResolve([{}])

      return target.getUnitSpecificationDetailsByExperimentId(1, false, testContext, testTx).then((data) => {
        expect(db.unitSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    test('rejects when findAllByExperimentId fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockResolve()
      db.unitSpecificationDetail.findAllByExperimentId = mockReject(error)

      return target.getUnitSpecificationDetailsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(db.unitSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      db.unitSpecificationDetail.findAllByExperimentId = mock()

      return target.getUnitSpecificationDetailsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.unitSpecificationDetail.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getUnitSpecificationDetailById', () => {
    test('gets a unit specification detail', () => {
      db.unitSpecificationDetail.find = mockResolve({})

      return target.getUnitSpecificationDetailById(1, testContext, testTx).then((data) => {
        expect(db.unitSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    test('throws an error when find returns empty', () => {
      db.unitSpecificationDetail.find = mockResolve()
      AppError.notFound = mock()

      return target.getUnitSpecificationDetailById(1, testContext, testTx).then(() => {}, () => {
        expect(db.unitSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Unit Specification Detail Not Found for requested id', undefined, '1S2001')
      })
    })

    test('rejects when find fails', () => {
      const error = { message: 'error' }
      db.unitSpecificationDetail.find = mockReject(error)

      return target.getUnitSpecificationDetailById(1, testContext, testTx).then(() => {}, (err) => {
        expect(db.unitSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchCreateUnitSpecificationDetails', () => {
    test('creates unit specification details', () => {
      target.validator.validate = mockResolve()
      db.unitSpecificationDetail.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.unitSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      const error = { message: 'error' }
      db.unitSpecificationDetail.batchCreate = mockReject(error)

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.unitSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.unitSpecificationDetail.batchCreate = mockReject(error)

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.unitSpecificationDetail.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchUpdateUnitSpecificationDetails', () => {
    test('updates unit specification details', () => {
      target.validator.validate = mockResolve()
      db.unitSpecificationDetail.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.unitSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      const error = { message: 'error' }
      db.unitSpecificationDetail.batchUpdate = mockReject(error)

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.unitSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.unitSpecificationDetail.batchUpdate = mockReject(error)

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.unitSpecificationDetail.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
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
      db.unitSpecificationDetail.batchRemove = mockResolve([1])
      return target.deleteUnitSpecificationDetails([1], testContext, testTx).then((data) => {
        expect(db.unitSpecificationDetail.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    test('resolves when no ids are passed in for delete', () => {
      db.unitSpecificationDetail.batchRemove = mock()
      return target.deleteUnitSpecificationDetails([], testContext, testTx).then(() => {
        expect(db.unitSpecificationDetail.batchRemove).not.toHaveBeenCalled()
      })
    })

    test('throws an error when not all unit specification details are found for delete', () => {
      db.unitSpecificationDetail.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.deleteUnitSpecificationDetails([1, 2], testContext, testTx).then(() => {}, () => {
        expect(db.unitSpecificationDetail.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
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
})
