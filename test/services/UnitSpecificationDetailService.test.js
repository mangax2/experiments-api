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
    it('gets unit specification details', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.unitSpecificationDetail.findAllByExperimentId = mockResolve([{}])

      return target.getUnitSpecificationDetailsByExperimentId(1, testTx).then((data) => {
        expect(db.unitSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when findAllByExperimentId fails', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.unitSpecificationDetail.findAllByExperimentId = mockReject('error')

      return target.getUnitSpecificationDetailsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(db.unitSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.unitSpecificationDetail.findAllByExperimentId = mock()

      return target.getUnitSpecificationDetailsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unitSpecificationDetail.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getUnitSpecificationDetailById', () => {
    it('gets a unit specification detail', () => {
      db.unitSpecificationDetail.find = mockResolve({})

      return target.getUnitSpecificationDetailById(1, testTx).then((data) => {
        expect(db.unitSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when find returns empty', () => {
      db.unitSpecificationDetail.find = mockResolve()
      AppError.notFound = mock()

      return target.getUnitSpecificationDetailById(1, testTx).then(() => {}, () => {
        expect(db.unitSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Unit Specification Detail Not Found for' +
          ' requested id')
      })
    })

    it('rejects when find fails', () => {
      db.unitSpecificationDetail.find = mockReject('error')

      return target.getUnitSpecificationDetailById(1, testTx).then(() => {}, (err) => {
        expect(db.unitSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetUnitSpecificationDetailsByIds', () => {
    it('gets unit specification details', () => {
      db.unitSpecificationDetail.batchFind = mockResolve([{}])

      return target.batchGetUnitSpecificationDetailsByIds([1], testTx).then((data) => {
        expect(db.unitSpecificationDetail.batchFind).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([{}])
      })
    })

    it('throws an error when not all requested ids are returned', () => {
      db.unitSpecificationDetail.batchFind = mockResolve([{}])
      AppError.notFound = mock()

      return target.batchGetUnitSpecificationDetailsByIds([1, 2], testTx).then(() => {}, () => {
        expect(db.unitSpecificationDetail.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Unit Specification Detail not found for' +
          ' all requested ids.')
      })
    })

    it('rejects when batchFind fails', () => {
      db.unitSpecificationDetail.batchFind = mockReject('error')

      return target.batchGetUnitSpecificationDetailsByIds([1, 2], testTx).then(() => {}, (err) => {
        expect(db.unitSpecificationDetail.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchCreateUnitSpecificationDetails', () => {
    it('creates unit specification details', () => {
      target.validator.validate = mockResolve()
      db.unitSpecificationDetail.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.unitSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.unitSpecificationDetail.batchCreate = mockReject('error')

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.unitSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.unitSpecificationDetail.batchCreate = mockReject('error')

      return target.batchCreateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.unitSpecificationDetail.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateUnitSpecificationDetails', () => {
    it('updates unit specification details', () => {
      target.validator.validate = mockResolve()
      db.unitSpecificationDetail.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.unitSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.unitSpecificationDetail.batchUpdate = mockReject('error')

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.unitSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.unitSpecificationDetail.batchUpdate = mockReject('error')

      return target.batchUpdateUnitSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.unitSpecificationDetail.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('manageAllUnitSpecificationDetails', () => {
    it('manages delete, update, and create unit specification details call', () => {
      target.deleteUnitSpecificationDetails = mockResolve()
      target.updateUnitSpecificationDetails = mockResolve()
      target.createUnitSpecificationDetails = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllUnitSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, testTx).then(() => {
        expect(target.deleteUnitSpecificationDetails).toHaveBeenCalledWith([1], testTx)
        expect(target.updateUnitSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createUnitSpecificationDetails).toHaveBeenCalledWith([{},{}], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    it('rejects when create fails', () => {
      target.deleteUnitSpecificationDetails = mockResolve()
      target.updateUnitSpecificationDetails = mockResolve()
      target.createUnitSpecificationDetails = mockReject('error')
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllUnitSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, testTx).then(() => {}, (err) => {
        expect(target.deleteUnitSpecificationDetails).toHaveBeenCalledWith([1], testTx)
        expect(target.updateUnitSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createUnitSpecificationDetails).toHaveBeenCalledWith([{},{}], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when update fails', () => {
      target.deleteUnitSpecificationDetails = mockResolve()
      target.updateUnitSpecificationDetails = mockReject('error')
      target.createUnitSpecificationDetails = mockReject('error')
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllUnitSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, testTx).then(() => {}, (err) => {
        expect(target.deleteUnitSpecificationDetails).toHaveBeenCalledWith([1], testTx)
        expect(target.updateUnitSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createUnitSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when delete fails', () => {
      target.deleteUnitSpecificationDetails = mockReject('error')
      target.updateUnitSpecificationDetails = mockReject('error')
      target.createUnitSpecificationDetails = mockReject('error')
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllUnitSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, testContext, testTx).then(() => {}, (err) => {
        expect(target.deleteUnitSpecificationDetails).toHaveBeenCalledWith([1], testTx)
        expect(target.updateUnitSpecificationDetails).not.toHaveBeenCalled()
        expect(target.createUnitSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteUnitSpecificationDetails', () => {
    it('deletes unit specification details', () => {
      db.unitSpecificationDetail.batchRemove = mockResolve([1])

      return target.deleteUnitSpecificationDetails([1], testTx).then((data) => {
        expect(db.unitSpecificationDetail.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    it('resolves when no ids are passed in for delete', () => {
      db.unitSpecificationDetail.batchRemove = mock()

      return target.deleteUnitSpecificationDetails([], testTx).then(() => {
        expect(db.unitSpecificationDetail.batchRemove).not.toHaveBeenCalled()
      })
    })

    it('throws an error when not all unit specification details are found for delete', () => {
      db.unitSpecificationDetail.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.deleteUnitSpecificationDetails([1,2], testTx).then(() => {}, () => {
        expect(db.unitSpecificationDetail.batchRemove).toHaveBeenCalledWith([1,2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all unit specification detail ids' +
          ' requested for delete were found')
      })
    })
  })

  describe('updateUnitSpecificationDetails', () => {
    it('updates unit specification details', () => {
      target.batchUpdateUnitSpecificationDetails = mockResolve([{}])

      return target.updateUnitSpecificationDetails([{}], testTx).then((data) => {
        expect(target.batchUpdateUnitSpecificationDetails).toHaveBeenCalledWith([{}], testTx)
        expect(data).toEqual([{}])
      })
    })

    it('does not update units when none are passed in', () => {
      target.batchUpdateUnitSpecificationDetails = mock()

      return target.updateUnitSpecificationDetails([], testTx).then(() => {
        expect(target.batchUpdateUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })
  })

  describe('createUnitSpecificationDetails', () => {
    it('creates unit specification details', () => {
      target.batchCreateUnitSpecificationDetails = mockResolve([{}])

      return target.createUnitSpecificationDetails([{}], testTx).then((data) => {
        expect(target.batchCreateUnitSpecificationDetails).toHaveBeenCalledWith([{}], testTx)
        expect(data).toEqual([{}])
      })
    })

    it('does not create unit specification details', () => {
      target.batchCreateUnitSpecificationDetails = mock()

      return target.createUnitSpecificationDetails([], testTx).then(() => {
        expect(target.batchCreateUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })
  })
})