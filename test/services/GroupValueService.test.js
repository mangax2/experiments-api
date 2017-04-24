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

  describe('getGroupValuesByGroupId', () => {
    it('returns group values', () => {
      target.groupService.getGroupById = mockResolve()
      db.groupValue.findAllByGroupId = mockResolve([{}])

      return target.getGroupValuesByGroupId(1, testTx).then((data) => {
        expect(target.groupService.getGroupById).toHaveBeenCalledWith(1, testTx)
        expect(db.groupValue.findAllByGroupId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when findAllByGroupId fails', () => {
      target.groupService.getGroupById = mockResolve()
      db.groupValue.findAllByGroupId = mockReject('error')

      return target.getGroupValuesByGroupId(1, testTx).then(() => {}, (err) => {
        expect(target.groupService.getGroupById).toHaveBeenCalledWith(1, testTx)
        expect(db.groupValue.findAllByGroupId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getGroupById fails', () => {
      target.groupService.getGroupById = mockReject('error')
      db.groupValue.findAllByGroupId = mockReject('error')

      return target.getGroupValuesByGroupId(1, testTx).then(() => {}, (err) => {
        expect(target.groupService.getGroupById).toHaveBeenCalledWith(1, testTx)
        expect(db.groupValue.findAllByGroupId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetGroupValuesByGroupIds', () => {
    it('returns group values', () => {
      target.groupService.batchGetGroupsByIds = mockResolve()
      db.groupValue.batchFindAllByGroupIds = mockResolve([{}, {}])

      return target.batchGetGroupValuesByGroupIds([1, 2], testTx).then((data) => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(db.groupValue.batchFindAllByGroupIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([{}, {}])
      })
    })

    it('rejects when batchFindAllByGroupIds fails', () => {
      target.groupService.batchGetGroupsByIds = mockResolve()
      db.groupValue.batchFindAllByGroupIds = mockReject('error')

      return target.batchGetGroupValuesByGroupIds([1, 2], testTx).then(() => {}, (err) => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(db.groupValue.batchFindAllByGroupIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchGetGroupsByIds fails', () => {
      target.groupService.batchGetGroupsByIds = mockReject('error')
      db.groupValue.batchFindAllByGroupIds = mockReject('error')

      return target.batchGetGroupValuesByGroupIds([1, 2], testTx).then(() => {}, (err) => {
        expect(target.groupService.batchGetGroupsByIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(db.groupValue.batchFindAllByGroupIds).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetGroupValuesByGroupIdsNoValidate', () => {
    it('returns group values without calling validate', () => {
      target.validator.validate = mock()
      db.groupValue.batchFindAllByGroupIds = mockResolve([{}])

      return target.batchGetGroupValuesByGroupIdsNoValidate([1, 2], testTx).then((data) => {
        expect(target.validator.validate).not.toHaveBeenCalled()
        expect(db.groupValue.batchFindAllByGroupIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when batchFindAllByGroupIds fails', () => {
      target.validator.validate = mock()
      db.groupValue.batchFindAllByGroupIds = mockReject('error')

      return target.batchGetGroupValuesByGroupIdsNoValidate([1, 2], testTx).then(() => {}, (err) => {
        expect(target.validator.validate).not.toHaveBeenCalled()
        expect(db.groupValue.batchFindAllByGroupIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getGroupValueById', () => {
    it('returns a group value', () => {
      db.groupValue.find = mockResolve({})

      return target.getGroupValueById(1, testTx).then((data) => {
        expect(db.groupValue.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when find returns empty', () => {
      db.groupValue.find = mockResolve()
      AppError.notFound = mock()

      return target.getGroupValueById(1, testTx).then(() => {}, () => {
        expect(db.groupValue.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Value Not Found for requested id')
      })
    })

    it('rejects when find fails', () => {
      db.groupValue.find = mockReject('error')

      return target.getGroupValueById(1, testTx).then(() => {}, (err) => {
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

  describe('deleteGroupValue', () => {
    it('deletes a group value', () => {
      db.groupValue.remove = mockResolve({})

      return target.deleteGroupValue(1, testTx).then((data) => {
        expect(db.groupValue.remove).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when no data is returned', () => {
      db.groupValue.remove = mockResolve()
      AppError.notFound = mock()

      return target.deleteGroupValue(1, testTx).then(() => {}, () => {
        expect(db.groupValue.remove).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Value Not Found for requested id')
      })
    })

    it('rejects when remove fails', () => {
      db.groupValue.remove = mockReject('error')

      return target.deleteGroupValue(1, testTx).then(() => {}, (err) => {
        expect(db.groupValue.remove).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchDeleteGroupValues', () => {
    it('deletes group values', () => {
      db.groupValue.batchRemove = mockResolve([1, 2])

      return target.batchDeleteGroupValues([1, 2], testTx).then((data) => {
        expect(db.groupValue.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })

    it('throws an error when not all group values were found to delete', () => {
      db.groupValue.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.batchDeleteGroupValues([1, 2], testTx).then(() => {}, () => {
        expect(db.groupValue.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all group values requested for' +
          ' delete were found')
      })
    })

    it('rejects when batchRemove fails', () => {
      db.groupValue.batchRemove = mockReject('error')

      return target.batchDeleteGroupValues([1, 2], testTx).then(() => {}, (err) => {
        expect(db.groupValue.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })
})