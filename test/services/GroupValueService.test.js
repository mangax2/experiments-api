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
    target = new GroupValueService()
  })

  describe('batchCreateGroupValues', () => {
    it('create group values', () => {
      target.validator.validate = mockResolve()
      db.groupValue.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateGroupValues([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.groupValue.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.groupValue.batchCreate = mockReject('error')

      return target.batchCreateGroupValues([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.groupValue.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.groupValue.batchCreate = mockReject('error')

      return target.batchCreateGroupValues([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.groupValue.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetGroupValuesByExperimentId', () => {
    it('calls ', () => {
      db.groupValue.batchFindAllByExperimentId = mockResolve()

      return target.batchGetGroupValuesByExperimentId(1, testTx).then(() => {
        expect(db.groupValue.batchFindAllByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })
  })

  describe('getGroupValueById', () => {
    it('returns a group value', () => {
      db.groupValue.find = mockResolve({})

      return target.getGroupValueById(1, {}, testTx).then((data) => {
        expect(db.groupValue.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when find returns empty', () => {
      db.groupValue.find = mockResolve()
      AppError.notFound = mock()

      return target.getGroupValueById(1, {}, testTx).then(() => {}, () => {
        expect(db.groupValue.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Value Not Found for requested id')
      })
    })

    it('rejects when find fails', () => {
      db.groupValue.find = mockReject('error')

      return target.getGroupValueById(1, {}, testTx).then(() => {}, (err) => {
        expect(db.groupValue.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateGroupValues', () => {
    it('updates group values', () => {
      target.validator.validate = mockResolve()
      db.groupValue.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateGroupValues([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.groupValue.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.groupValue.batchUpdate = mockReject('error')

      return target.batchUpdateGroupValues([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.groupValue.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.groupValue.batchUpdate = mockReject('error')

      return target.batchUpdateGroupValues([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.groupValue.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})