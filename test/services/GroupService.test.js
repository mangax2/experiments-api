import { mock, mockReject, mockResolve } from '../jestUtil'
import GroupService from '../../src/services/GroupService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'

describe('GroupService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new GroupService()
  })

  describe('batchCreateGroups', () => {
    it('validates, and creates groups', () => {
      target.validator.validate = mockResolve()
      db.group.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateGroups([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.group.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.group.batchCreate = mockReject('error')

      return target.batchCreateGroups([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.group.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.group.batchCreate = mockReject('error')

      return target.batchCreateGroups([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.group.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getGroupsByExperimentId', () => {
    it('returns groups for an experiment', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.group.findAllByExperimentId = mockResolve([{}])

      return target.getGroupsByExperimentId(1, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.group.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when findAllByExperimentId fails', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.group.findAllByExperimentId = mockReject('error')

      return target.getGroupsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.group.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.group.findAllByExperimentId = mockReject('error')

      return target.getGroupsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.group.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetGroupsByIds', () => {
    it('returns groups for experiment ids', () => {
      db.group.batchFind = mockResolve([{}, {}])

      return target.batchGetGroupsByIds([1, 2], testTx).then((data) => {
        expect(db.group.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([{}, {}])
      })
    })

    it('throws an error when returned groups do not match the number of groups requested', () => {
      db.group.batchFind = mockResolve([{}])
      AppError.notFound = mock()

      return target.batchGetGroupsByIds([1, 2], testTx).then(() => {}, () => {
        expect(db.group.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Group not found for all requested ids.')
      })
    })

    it('rejects when batchFind fails', () => {
      db.group.batchFind = mockReject('error')

      return target.batchGetGroupsByIds([1, 2], testTx).then(() => {}, (err) => {
        expect(db.group.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getGroupById', () => {
    it('returns a group', () => {
      db.group.find = mockResolve({})

      return target.getGroupById(1, testTx).then((data) => {
        expect(db.group.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when group is not found', () => {
      db.group.find = mockResolve()
      AppError.notFound = mock()

      return target.getGroupById(1, testTx).then(() => {}, () => {
        expect(db.group.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Not Found for requested id')
      })
    })

    it('rejects when find fails', () => {
      db.group.find = mockReject('error')

      return target.getGroupById(1, testTx).then(() => {}, (err) => {
        expect(db.group.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateGroups', () => {
    it('updates groups', () => {
      target.validator.validate = mockResolve()
      db.group.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateGroups([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.group.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.group.batchUpdate = mockReject('error')

      return target.batchUpdateGroups([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.group.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.group.batchUpdate = mockReject('error')

      return target.batchUpdateGroups([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.group.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteGroup', () => {
    it('deletes a group', () => {
      db.group.remove = mockResolve({})

      return target.deleteGroup(1, testTx).then((data) => {
        expect(db.group.remove).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when delete returns empty data', () => {
      db.group.remove = mockResolve()
      AppError.notFound = mock()

      return target.deleteGroup(1, testTx).then(() => {}, () => {
        expect(db.group.remove).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Not Found for requested id')
      })
    })

    it('rejects when remove fails', () => {
      db.group.remove = mockReject('error')

      return target.deleteGroup(1, testTx).then(() => {}, (err) => {
        expect(db.group.remove).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchDeleteGroups', () => {
    it('successfully calls batchRemove and returns data', () => {
      db.group.batchRemove = mockResolve([1])

      return target.batchDeleteGroups([1], testTx).then((data) => {
        expect(db.group.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    it('throws an error when no elements due to nulls', () => {
      db.group.batchRemove = mockResolve([null])
      AppError.notFound = mock()

      return target.batchDeleteGroups([1], testTx).then(() => {}, () => {
        expect(db.group.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all groups requested for delete were found')
      })
    })

    it('throws an error when not all elements are deleted', () => {
      db.group.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.batchDeleteGroups([1, 2], testTx).then(() => {}, () => {
        expect(db.group.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all groups requested for delete were found')
      })
    })
  })
})