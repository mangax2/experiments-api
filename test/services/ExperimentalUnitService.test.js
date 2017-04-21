import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentalUnitService from '../../src/services/ExperimentalUnitService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'

describe('ExperimentalUnitService', () => {
  const testContext = {}
  const testTx = { tx: {} }
  describe('batchCreateExperimentalUnits', () => {
    it('calls validate, batchCreate, and createPostResponse on success', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = mockResolve()
      db.unit.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchCreate fails', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = mockResolve()
      db.unit.batchCreate = mockReject('error')
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreate fails', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = mockReject('error')
      db.unit.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getExperimentalUnitsByTreatmentId', () => {
    it('calls getTreatmentById and findAllByTreatmentId', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.getTreatmentById = mockResolve()
      db.unit.findAllByTreatmentId = mockResolve()

      return target.getExperimentalUnitsByTreatmentId(1, testTx).then(() => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByTreatmentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when call to findAllByTreatmentId fails', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.getTreatmentById = mockResolve()
      db.unit.findAllByTreatmentId = mockReject('error')

      return target.getExperimentalUnitsByTreatmentId(1, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByTreatmentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when call to getTreatmentById fails', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.getTreatmentById = mockReject('error')
      db.unit.findAllByTreatmentId = mock()

      return target.getExperimentalUnitsByTreatmentId(1, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByTreatmentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetExperimentalUnitsByTreatmentIds', () => {
    it('calls batchGetTreatmentByIds and batchFindAllByTreatmentIds', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.batchGetTreatmentByIds = mockResolve()
      db.unit.batchFindAllByTreatmentIds = mockResolve()

      return target.batchGetExperimentalUnitsByTreatmentIds([1], testTx).then(() => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith([1], testTx)
        expect(db.unit.batchFindAllByTreatmentIds).toHaveBeenCalledWith([1], testTx)
      })
    })

    it('rejects when call to batchFindAllByTreatmentIds fails', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.batchGetTreatmentByIds = mockResolve()
      db.unit.batchFindAllByTreatmentIds = mockReject('error')

      return target.batchGetExperimentalUnitsByTreatmentIds(1, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.batchFindAllByTreatmentIds).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when call to batchGetTreatmentByIds fails', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.batchGetTreatmentByIds = mockReject('error')
      db.unit.batchFindAllByTreatmentIds = mock()

      return target.batchGetExperimentalUnitsByTreatmentIds(1, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.batchFindAllByTreatmentIds).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetExperimentalUnitsByGroupIds', () => {
    it('calls batchGetGroupsByIds and batchFindAllByGroupIds', () => {
      const target = new ExperimentalUnitService()
      target.groupService.batchGetGroupsByIds = mockResolve()
      db.unit.batchFindAllByGroupIds = mockResolve()

      return target.batchGetExperimentalUnitsByGroupIds([1], testTx).then(() => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith([1], testTx)
        expect(db.unit.batchFindAllByGroupIds).toHaveBeenCalledWith([1], testTx)
      })
    })

    it('rejects when call to batchGetGroupsByIds fails', () => {
      const target = new ExperimentalUnitService()
      target.groupService.batchGetGroupsByIds = mockResolve()
      db.unit.batchFindAllByGroupIds = mockReject('error')

      return target.batchGetExperimentalUnitsByGroupIds(1, testTx).then(() => {}, (err) => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.batchFindAllByGroupIds).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when call to batchFindAllByGroupIds fails', () => {
      const target = new ExperimentalUnitService()
      target.groupService.batchGetGroupsByIds = mockReject('error')
      db.unit.batchFindAllByGroupIds = mock()

      return target.batchGetExperimentalUnitsByGroupIds(1, testTx).then(() => {}, (err) => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.batchFindAllByGroupIds).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetExperimentalUnitsByGroupIdsNoValidate', () => {
    it('calls batchFindAllByGroupIds', () => {
      const target = new ExperimentalUnitService()
      db.unit.batchFindAllByGroupIds = mockResolve()

      return target.batchGetExperimentalUnitsByGroupIdsNoValidate([1], testTx).then(() => {
        expect(db.unit.batchFindAllByGroupIds).toHaveBeenCalledWith([1], testTx)
      })
    })
  })

  describe('getExperimentalUnitbyId', () => {
    it('calls find and returns data', () => {
      const target = new ExperimentalUnitService()
      db.unit.find = mockResolve({})

      return target.getExperimentalUnitById(1, testTx).then((data) => {
        expect(db.unit.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when data is undefined', () => {
      const target = new ExperimentalUnitService()
      db.unit.find = mockResolve()
      AppError.notFound = mock()

      return target.getExperimentalUnitById(1, testTx).then(() => {}, () => {
        expect(db.unit.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experimental Unit Not Found for' +
          ' requested id')
      })
    })
  })

  describe('getExperimentalUnitsByExperimentId', () => {
    it('calls getExperimentById and findAllByExperimentId', () => {
      const target = new ExperimentalUnitService()
      target.experimentService.getExperimentById = mockResolve()
      db.unit.findAllByExperimentId = mock()

      return target.getExperimentalUnitsByExperimentId(1, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when getExperimentById fails', () => {
      const target = new ExperimentalUnitService()
      target.experimentService.getExperimentById = mockReject('error')
      db.unit.findAllByExperimentId = mock()

      return target.getExperimentalUnitsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateExperimentalUnits', () => {
    it('calls validate, batchUpdate, and createPutResponse', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = mockResolve()
      db.unit.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchUpdate fails', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = mockResolve()
      db.unit.batchUpdate = mockReject('error')
      AppUtil.createPutResponse = mock()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = mockReject('error')
      db.unit.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteExperimentalUnit', () => {
    it('deletes and returns data', () => {
      const target = new ExperimentalUnitService()
      db.unit.remove = mockResolve({})

      return target.deleteExperimentalUnit(1, testTx).then(() => {
        expect(db.unit.remove).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('throws an error when returned data is undefined', () => {
      const target = new ExperimentalUnitService()
      db.unit.remove = mockResolve()
      AppError.notFound = mock()

      return target.deleteExperimentalUnit(1, testTx).then(() => {}, () => {
        expect(db.unit.remove).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experimental Unit Not Found for' +
          ' requested id')
      })
    })
  })

  describe('batchDeleteExperimentalUnits', () => {
    it('successfully calls batchRemove and returns data', () => {
      const target = new ExperimentalUnitService()
      db.unit.batchRemove = mockResolve([1])

      return target.batchDeleteExperimentalUnits([1], testTx).then((data) => {
        expect(db.unit.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    it('throws an error when no elements due to nulls', () => {
      const target = new ExperimentalUnitService()
      db.unit.batchRemove = mockResolve([null])
      AppError.notFound = mock()

      return target.batchDeleteExperimentalUnits([1], testTx).then(() => {}, () => {
        expect(db.unit.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all experimental units requested for' +
          ' delete were found')
      })
    })

    it('throws an error when not all elements are deleted', () => {
      const target = new ExperimentalUnitService()
      db.unit.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.batchDeleteExperimentalUnits([1,2], testTx).then(() => {}, () => {
        expect(db.unit.batchRemove).toHaveBeenCalledWith([1,2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all experimental units requested for' +
          ' delete were found')
      })
    })
  })
})