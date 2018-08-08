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
    expect.hasAssertions()
    target = new GroupService()
  })

  describe('batchCreateGroups', () => {
    test('validates, and creates groups', () => {
      target.validator.validate = mockResolve()
      db.group.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateGroups([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.group.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.group.batchCreate = mockReject(error)

      return target.batchCreateGroups([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.group.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.group.batchCreate = mockReject(error)

      return target.batchCreateGroups([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.group.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getGroupsByExperimentId', () => {
    test('returns groups for an experiment', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.group.findAllByExperimentId = mockResolve([{}])

      return target.getGroupsByExperimentId(1, false, testContext, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.group.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    test('rejects when findAllByExperimentId fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockResolve()
      db.group.findAllByExperimentId = mockReject(error)

      return target.getGroupsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.group.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      db.group.findAllByExperimentId = mockReject(error)

      return target.getGroupsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.group.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getGroupById', () => {
    test('returns a group', () => {
      db.group.find = mockResolve({})

      return target.getGroupById(1, {}, testTx).then((data) => {
        expect(db.group.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    test('throws an error when group is not found', () => {
      db.group.find = mockResolve()
      AppError.notFound = mock()

      return target.getGroupById(1, {}, testTx).then(() => {}, () => {
        expect(db.group.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Group Not Found for requested id', undefined, '1G3001')
      })
    })

    test('rejects when find fails', () => {
      const error = { message: 'error' }
      db.group.find = mockReject(error)

      return target.getGroupById(1, {}, testTx).then(() => {}, (err) => {
        expect(db.group.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchUpdateGroups', () => {
    test('updates groups', () => {
      target.validator.validate = mockResolve()
      db.group.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateGroups([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.group.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.group.batchUpdate = mockReject(error)

      return target.batchUpdateGroups([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.group.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.group.batchUpdate = mockReject(error)

      return target.batchUpdateGroups([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.group.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('partiallyUpdateGroup', () => {
    test('partially updates a group', () => {
      target.validator.validate = mockResolve()
      db.group.partiallyUpdate = mockResolve()

      return target.partiallyUpdateGroup([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toBeCalledWith([{}], 'PATCH', testTx)
        expect(db.group.partiallyUpdate).toBeCalledWith([{}], testContext, testTx)
      })
    })
  })

  describe('batchDeleteGroups', () => {
    test('successfully calls batchRemove and returns data', () => {
      db.group.batchRemove = mockResolve([1])

      return target.batchDeleteGroups([1], {}, testTx).then((data) => {
        expect(db.group.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    test('throws an error when no elements due to nulls', () => {
      db.group.batchRemove = mockResolve([null])
      AppError.notFound = mock()

      return target.batchDeleteGroups([1], {}, testTx).then(() => {}, () => {
        expect(db.group.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all groups requested for delete were found', undefined, '1G7001')
      })
    })

    test('throws an error when not all elements are deleted', () => {
      db.group.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.batchDeleteGroups([1, 2], {}, testTx).then(() => {}, () => {
        expect(db.group.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all groups requested for delete were found', undefined, '1G7001')
      })
    })
  })
})
