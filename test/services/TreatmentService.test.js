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
    expect.hasAssertions()
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
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.treatment.batchCreate = mockReject(error)

      return target.batchCreateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.treatment.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.treatment.batchCreate = mockReject(error)

      return target.batchCreateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.treatment.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
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
        expect(AppError.notFound).toHaveBeenCalledWith('Treatment not found for all requested ids.', undefined, '1R4001')
      })
    })

    test('rejects when batchFind fails', () => {
      const error = { message: 'error' }
      db.treatment.batchFind = mockReject(error)

      return target.batchGetTreatmentByIds([1, 2], {}, testTx).then(() => {}, (err) => {
        expect(db.treatment.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual(error)
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
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.treatment.batchUpdate = mockReject(error)

      return target.batchUpdateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.treatment.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.treatment.batchUpdate = mockReject(error)

      return target.batchUpdateTreatments([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.treatment.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchDeleteTreatments', () => {
    test('throws an error when some treatments are used for units connected to sets', () => {
      db.unit.batchFindAllByTreatmentIds = mockResolve([{ set_entry_id: 123 }])
      db.treatment.batchRemove = mock()
      AppError.badRequest = mock()

      return target.batchDeleteTreatments([1, 2], {}, testTx).then(() => {}, () => {
        expect(db.treatment.batchRemove).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Cannot delete treatments that are used in sets', undefined, '1R6002')
      })
    })

    test('deletes treatments', () => {
      db.unit.batchFindAllByTreatmentIds = mockResolve([])
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
        expect(AppError.notFound).toHaveBeenCalledWith('Not all treatments requested for delete were found', undefined, '1R6001')
      })
    })

    test('rejects when batchRemove fails', () => {
      const error = { message: 'error' }
      db.treatment.batchRemove = mockReject(error)

      return target.batchDeleteTreatments([1, 2], {}, testTx).then(() => {}, (err) => {
        expect(db.treatment.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual(error)
      })
    })
  })
})
