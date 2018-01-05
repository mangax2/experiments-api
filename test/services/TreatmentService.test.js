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
    test('creates treatments', () => {
      target.validator.validate = mockResolve()
      db.treatment.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateTreatments([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.treatment.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.treatment.batchCreate = mockReject('error')

      return target.batchCreateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.treatment.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    test('rejects when validate fails', () => {
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
    test('finds all treatments for an experiment', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.treatment.findAllByExperimentId = mockResolve([{}])

      return target.getTreatmentsByExperimentId(1, false, testContext, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.treatment.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    test('rejects when findAllByExperimentId fails', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.treatment.findAllByExperimentId = mockReject('error')

      return target.getTreatmentsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.treatment.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    test('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.treatment.findAllByExperimentId = mockReject('error')

      return target.getTreatmentsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.treatment.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getTreatmentById', () => {
    test('gets a treatment', () => {
      db.treatment.find = mockResolve({})

      return target.getTreatmentById(1, {}, testTx).then((data) => {
        expect(db.treatment.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    test('throws an error when treatment is empty', () => {
      db.treatment.find = mockResolve()
      AppError.notFound = mock()

      return target.getTreatmentById(1, {}, testTx).then(() => {}, () => {
        expect(db.treatment.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Treatment Not Found for requested id')
      })
    })

    test('rejects when find fails', () => {
      db.treatment.find = mockReject('error')

      return target.getTreatmentById(1, {}, testTx).then(() => {}, (err) => {
        expect(db.treatment.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetTreatmentByIds', () => {
    test('gets treatments', () => {
      db.treatment.batchFind = mockResolve([{}, {}])

      return target.batchGetTreatmentByIds([1, 2], {}, testTx).then((data) => {
        expect(db.treatment.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([{}, {}])
      })
    })

    test('throws an error when number of returned treatments is not equal to requested', () => {
      db.treatment.batchFind = mockResolve([{}])
      AppError.notFound = mock()

      return target.batchGetTreatmentByIds([1, 2], {}, testTx).then(() => {}, () => {
        expect(db.treatment.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Treatment not found for all requested ids.')
      })
    })

    test('rejects when batchFind fails', () => {
      db.treatment.batchFind = mockReject('error')

      return target.batchGetTreatmentByIds([1, 2], {}, testTx).then(() => {}, (err) => {
        expect(db.treatment.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateTreatments', () => {
    test('updates treatments', () => {
      target.validator.validate = mockResolve()
      db.treatment.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateTreatments([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.treatment.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.treatment.batchUpdate = mockReject('error')

      return target.batchUpdateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.treatment.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    test('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.treatment.batchUpdate = mockReject('error')

      return target.batchUpdateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.treatment.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchDeleteTreatments', () => {
    test('deletes treatments', () => {
      db.treatment.batchRemove = mockResolve([1, 2])

      return target.batchDeleteTreatments([1, 2], {}, testTx).then((data) => {
        expect(db.treatment.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })

    test('throws an error when not all treatments are deleted', () => {
      db.treatment.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.batchDeleteTreatments([1, 2], {}, testTx).then(() => {}, () => {
        expect(db.treatment.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all treatments requested for delete' +
          ' were found')
      })
    })

    test('rejects when batchRemove fails', () => {
      db.treatment.batchRemove = mockReject('error')

      return target.batchDeleteTreatments([1, 2], {}, testTx).then(() => {}, (err) => {
        expect(db.treatment.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })
})
