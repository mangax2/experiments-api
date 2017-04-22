import { mock, mockReject, mockResolve } from '../jestUtil'
import TreatmentService from '../../src/services/TreatmentService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'

describe('TreatmentService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new TreatmentService()
  })

  describe('batchCreateTreatments', () => {
    it('creates treatments', () => {
      target.validator.validate = mockResolve()
      db.treatment.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateTreatments([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.treatment.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.treatment.batchCreate = mockReject('error')

      return target.batchCreateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.treatment.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.treatment.batchCreate = mockReject('error')

      return target.batchCreateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.treatment.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getTreatmentsByExperimentId', () => {
    it('finds all treatments for an experiment', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.treatment.findAllByExperimentId = mockResolve([{}])

      return target.getTreatmentsByExperimentId(1, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when findAllByExperimentId fails', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.treatment.findAllByExperimentId = mockReject('error')

      return target.getTreatmentsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.treatment.findAllByExperimentId = mockReject('error')

      return target.getTreatmentsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getTreatmentById', () => {
    it('gets a treatment', () => {
      db.treatment.find = mockResolve({})

      return target.getTreatmentById(1, testTx).then((data) => {
        expect(db.treatment.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when treatment is empty', () => {
      db.treatment.find = mockResolve()
      AppError.notFound = mock()

      return target.getTreatmentById(1, testTx).then(() => {}, () => {
        expect(db.treatment.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Treatment Not Found for requested id')
      })
    })

    it('rejects when find fails', () => {
      db.treatment.find = mockReject('error')

      return target.getTreatmentById(1, testTx).then(() => {}, (err) => {
        expect(db.treatment.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetTreatmentByIds', () => {
    it('gets treatments', () => {
      db.treatment.batchFind = mockResolve([{}, {}])

      return target.batchGetTreatmentByIds([1, 2], testTx).then((data) => {
        expect(db.treatment.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([{}, {}])
      })
    })

    it('throws an error when number of returned treatments is not equal to requested', () => {
      db.treatment.batchFind = mockResolve([{}])
      AppError.notFound = mock()

      return target.batchGetTreatmentByIds([1, 2], testTx).then(() => {}, () => {
        expect(db.treatment.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Treatment not found for all requested ids.')
      })
    })

    it('rejects when batchFind fails', () => {
      db.treatment.batchFind = mockReject('error')

      return target.batchGetTreatmentByIds([1, 2], testTx).then(() => {}, (err) => {
        expect(db.treatment.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateTreatments', () => {
    it('updates treatments', () => {
      target.validator.validate = mockResolve()
      db.treatment.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateTreatments([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.treatment.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.treatment.batchUpdate = mockReject('error')

      return target.batchUpdateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.treatment.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.treatment.batchUpdate = mockReject('error')

      return target.batchUpdateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.treatment.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteTreatment', () => {
    it('deletes a treatment', () => {
      db.treatment.remove = mockResolve(1)

      return target.deleteTreatment(1, testTx).then((data) => {
        expect(db.treatment.remove).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual(1)
      })
    })

    it('throws an error when treatment not found to delete', () => {
      db.treatment.remove = mockResolve()
      AppError.notFound = mock()

      return target.deleteTreatment(1, testTx).then(() => {}, () => {
        expect(db.treatment.remove).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Treatment Not Found for requested id')
      })
    })

    it('rejects when remove fails', () => {
      db.treatment.remove = mockReject('error')

      return target.deleteTreatment(1, testTx).then(() => {}, (err) => {
        expect(db.treatment.remove).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchDeleteTreatments', () => {
    it('deletes treatments', () => {
      db.treatment.batchRemove = mockResolve([1, 2])

      return target.batchDeleteTreatments([1, 2], testTx).then((data) => {
        expect(db.treatment.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })

    it('throws an error when not all treatments are deleted', () => {
      db.treatment.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.batchDeleteTreatments([1, 2], testTx).then(() => {}, () => {
        expect(db.treatment.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all treatments requested for delete' +
          ' were found')
      })
    })

    it('rejects when batchRemove fails', () => {
      db.treatment.batchRemove = mockReject('error')

      return target.batchDeleteTreatments([1, 2], testTx).then(() => {}, (err) => {
        expect(db.treatment.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteTreatmentsForExperimentId', () => {
    it('deletes treatments', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.treatment.removeByExperimentId = mockResolve([1])

      return target.deleteTreatmentsForExperimentId(1, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.removeByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([1])
      })
    })

    it('rejects when removeByExperimentId fails', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.treatment.removeByExperimentId = mockReject('error')

      return target.deleteTreatmentsForExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.removeByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.treatment.removeByExperimentId = mockReject('error')

      return target.deleteTreatmentsForExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.removeByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})