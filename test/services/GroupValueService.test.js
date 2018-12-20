import { mock, mockReject, mockResolve } from '../jestUtil'
import GroupValueService from '../../src/services/GroupValueService'
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
