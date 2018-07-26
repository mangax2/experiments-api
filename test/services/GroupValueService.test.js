import { mock, mockReject, mockResolve } from '../jestUtil'
import GroupValueService from '../../src/services/GroupValueService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'

describe('GroupValueService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    expect.hasAssertions()
    target = new GroupValueService()
  })

  describe('batchCreateGroupValues', () => {
    test('create group values', () => {
      target.validator.validate = mockResolve()
      db.groupValue.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateGroupValues([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.groupValue.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.groupValue.batchCreate = mockReject(error)

      return target.batchCreateGroupValues([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.groupValue.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.groupValue.batchCreate = mockReject(error)

      return target.batchCreateGroupValues([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.groupValue.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchGetGroupValuesByExperimentId', () => {
    test('calls ', () => {
      db.groupValue.batchFindAllByExperimentId = mockResolve()

      return target.batchGetGroupValuesByExperimentId(1, testTx).then(() => {
        expect(db.groupValue.batchFindAllByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })
  })

  describe('getGroupValueById', () => {
    test('returns a group value', () => {
      db.groupValue.find = mockResolve({})

      return target.getGroupValueById(1, {}, testTx).then((data) => {
        expect(db.groupValue.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    test('throws an error when find returns empty', () => {
      db.groupValue.find = mockResolve()
      AppError.notFound = mock()

      return target.getGroupValueById(1, {}, testTx).then(() => {}, () => {
        expect(db.groupValue.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Value Not Found for requested id', undefined, '1I3001')
      })
    })

    test('rejects when find fails', () => {
      const error = { message: 'error' }
      db.groupValue.find = mockReject(error)

      return target.getGroupValueById(1, {}, testTx).then(() => {}, (err) => {
        expect(db.groupValue.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchUpdateGroupValues', () => {
    test('updates group values', () => {
      target.validator.validate = mockResolve()
      db.groupValue.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateGroupValues([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.groupValue.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.groupValue.batchUpdate = mockReject(error)

      return target.batchUpdateGroupValues([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.groupValue.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.groupValue.batchUpdate = mockReject(error)

      return target.batchUpdateGroupValues([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.groupValue.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
