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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.unit.batchCreate = jest.fn(() => Promise.resolve({}))
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchCreate fails', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.unit.batchCreate = jest.fn(() => Promise.reject('error'))
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
      })
    })

    it('rejects when batchCreate fails', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = jest.fn(() => Promise.reject())
      db.unit.batchCreate = jest.fn()
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateExperimentalUnits([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.unit.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
      })
    })
  })

  describe('getExperimentalUnitsByTreatmentId', () => {
    it('calls getTreatmentById and findAllByTreatmentId', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.getTreatmentById = jest.fn(() => Promise.resolve())
      db.unit.findAllByTreatmentId = jest.fn(() => Promise.resolve())

      return target.getExperimentalUnitsByTreatmentId(1, testTx).then(() => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByTreatmentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when call to findAllByTreatmentId fails', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.getTreatmentById = jest.fn(() => Promise.resolve())
      db.unit.findAllByTreatmentId = jest.fn(() => Promise.reject())

      return target.getExperimentalUnitsByTreatmentId(1, testTx).then(() => {}, () => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByTreatmentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when call to getTreatmentById fails', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.getTreatmentById = jest.fn(() => Promise.reject())
      db.unit.findAllByTreatmentId = jest.fn()

      return target.getExperimentalUnitsByTreatmentId(1, testTx).then(() => {}, () => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByTreatmentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('batchGetExperimentalUnitsByTreatmentIds', () => {
    it('calls batchGetTreatmentByIds and batchFindAllByTreatmentIds', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.batchGetTreatmentByIds = jest.fn(() => Promise.resolve())
      db.unit.batchFindAllByTreatmentIds = jest.fn(() => Promise.resolve())

      return target.batchGetExperimentalUnitsByTreatmentIds([1], testTx).then(() => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith([1], testTx)
        expect(db.unit.batchFindAllByTreatmentIds).toHaveBeenCalledWith([1], testTx)
      })
    })

    it('rejects when call to batchFindAllByTreatmentIds fails', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.batchGetTreatmentByIds = jest.fn(() => Promise.resolve())
      db.unit.batchFindAllByTreatmentIds = jest.fn(() => Promise.reject())

      return target.batchGetExperimentalUnitsByTreatmentIds(1, testTx).then(() => {}, () => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.batchFindAllByTreatmentIds).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when call to batchGetTreatmentByIds fails', () => {
      const target = new ExperimentalUnitService()
      target.treatmentService.batchGetTreatmentByIds = jest.fn(() => Promise.reject())
      db.unit.batchFindAllByTreatmentIds = jest.fn()

      return target.batchGetExperimentalUnitsByTreatmentIds(1, testTx).then(() => {}, () => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.batchFindAllByTreatmentIds).not.toHaveBeenCalled()
      })
    })
  })

  describe('batchGetExperimentalUnitsByGroupIds', () => {
    it('calls batchGetGroupsByIds and batchFindAllByGroupIds', () => {
      const target = new ExperimentalUnitService()
      target.groupService.batchGetGroupsByIds = jest.fn(() => Promise.resolve())
      db.unit.batchFindAllByGroupIds = jest.fn(() => Promise.resolve())

      return target.batchGetExperimentalUnitsByGroupIds([1], testTx).then(() => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith([1], testTx)
        expect(db.unit.batchFindAllByGroupIds).toHaveBeenCalledWith([1], testTx)
      })
    })

    it('rejects when call to batchGetGroupsByIds fails', () => {
      const target = new ExperimentalUnitService()
      target.groupService.batchGetGroupsByIds = jest.fn(() => Promise.resolve())
      db.unit.batchFindAllByGroupIds = jest.fn(() => Promise.reject())

      return target.batchGetExperimentalUnitsByGroupIds(1, testTx).then(() => {}, () => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.batchFindAllByGroupIds).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when call to batchFindAllByGroupIds fails', () => {
      const target = new ExperimentalUnitService()
      target.groupService.batchGetGroupsByIds = jest.fn(() => Promise.reject())
      db.unit.batchFindAllByGroupIds = jest.fn()

      return target.batchGetExperimentalUnitsByGroupIds(1, testTx).then(() => {}, () => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.batchFindAllByGroupIds).not.toHaveBeenCalled()
      })
    })
  })

  describe('batchGetExperimentalUnitsByGroupIdsNoValidate', () => {
    it('calls batchFindAllByGroupIds', () => {
      const target = new ExperimentalUnitService()
      db.unit.batchFindAllByGroupIds = jest.fn(() => Promise.resolve())

      return target.batchGetExperimentalUnitsByGroupIdsNoValidate([1], testTx).then(() => {
        expect(db.unit.batchFindAllByGroupIds).toHaveBeenCalledWith([1], testTx)
      })
    })
  })

  describe('getExperimentalUnitbyId', () => {
    it('calls find and returns data', () => {
      const target = new ExperimentalUnitService()
      db.unit.find = jest.fn(() => Promise.resolve({}))

      return target.getExperimentalUnitById(1, testTx).then((data) => {
        expect(db.unit.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when data is undefined', () => {
      const target = new ExperimentalUnitService()
      db.unit.find = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

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
      target.experimentService.getExperimentById = jest.fn(() => Promise.resolve())
      db.unit.findAllByExperimentId = jest.fn()

      return target.getExperimentalUnitsByExperimentId(1, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when getExperimentById fails', () => {
      const target = new ExperimentalUnitService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.reject())
      db.unit.findAllByExperimentId = jest.fn()

      return target.getExperimentalUnitsByExperimentId(1, testTx).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.unit.findAllByExperimentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('batchUpdateExperimentalUnits', () => {
    it('calls validate, batchUpdate, and createPutResponse', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.unit.batchUpdate = jest.fn(() => Promise.resolve({}))
      AppUtil.createPutResponse = jest.fn()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchUpdate fails', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.unit.batchUpdate = jest.fn(() => Promise.reject())
      AppUtil.createPutResponse = jest.fn()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
      })
    })

    it('rejects when validate fails', () => {
      const target = new ExperimentalUnitService()
      target.validator.validate = jest.fn(() => Promise.reject())
      db.unit.batchUpdate = jest.fn()
      AppUtil.createPutResponse = jest.fn()

      return target.batchUpdateExperimentalUnits([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.unit.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
      })
    })
  })

  describe('deleteExperimentalUnit', () => {
    it('deletes and returns data', () => {
      const target = new ExperimentalUnitService()
      db.unit.remove = jest.fn(() => Promise.resolve({}))

      return target.deleteExperimentalUnit(1, testTx).then(() => {
        expect(db.unit.remove).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('throws an error when returned data is undefined', () => {
      const target = new ExperimentalUnitService()
      db.unit.remove = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

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
      db.unit.batchRemove = jest.fn(() => Promise.resolve([1]))

      return target.batchDeleteExperimentalUnits([1], testTx).then((data) => {
        expect(db.unit.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    it('throws an error when no elements due to nulls', () => {
      const target = new ExperimentalUnitService()
      db.unit.batchRemove = jest.fn(() => Promise.resolve([null]))
      AppError.notFound = jest.fn()

      return target.batchDeleteExperimentalUnits([1], testTx).then(() => {}, () => {
        expect(db.unit.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all experimental units requested for' +
          ' delete were found')
      })
    })

    it('throws an error when not all elements are deleted', () => {
      const target = new ExperimentalUnitService()
      db.unit.batchRemove = jest.fn(() => Promise.resolve([1]))
      AppError.notFound = jest.fn()

      return target.batchDeleteExperimentalUnits([1,2], testTx).then(() => {}, () => {
        expect(db.unit.batchRemove).toHaveBeenCalledWith([1,2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all experimental units requested for' +
          ' delete were found')
      })
    })
  })
})