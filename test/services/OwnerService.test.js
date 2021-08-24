import { mock, mockResolve, mockReject } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import OwnerService from '../../src/services/OwnerService'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('OwnerService', () => {
  let target
  const testTx = { tx: {} }
  const testContext = {}

  beforeEach(() => {
    target = new OwnerService()
  })

  describe('batchCreateOwners', () => {
    test('calls batchCreate and succeeds', () => {
      target.validator.validate = mockResolve()
      dbWrite.owner.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateOwners([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testContext)
        expect(dbWrite.owner.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.owner.batchCreate = mockReject(error)

      return target.batchCreateOwners([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testContext)
        expect(dbWrite.owner.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.owner.batchCreate = mock()

      return target.batchCreateOwners([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testContext)
        expect(dbWrite.owner.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getOwnersByExperimentId', () => {
    test('returns owners for an experimentId', () => {
      dbRead.owner.findByExperimentId = mockResolve(['test'])

      return target.getOwnersByExperimentId(1).then((data) => {
        expect(dbRead.owner.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual(['test'])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.owner.findByExperimentId = mockReject(error)

      return target.getOwnersByExperimentId(1).then(() => {}, (err) => {
        expect(dbRead.owner.findByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('getOwnersByExperimentIds', () => {
    test('returns owners for passed in ids', () => {
      dbRead.owner.batchFindByExperimentIds = mockResolve([])

      return target.getOwnersByExperimentIds([1, 2]).then(() => {
        expect(dbRead.owner.batchFindByExperimentIds).toHaveBeenCalledWith([1, 2])
      })
    })

    test('rejects when batchFindByExperimentIds fails', () => {
      const error = { message: 'error' }
      dbRead.owner.batchFindByExperimentIds = mockReject(error)

      return target.getOwnersByExperimentIds([1, 2]).then(() => {}, (err) => {
        expect(dbRead.owner.batchFindByExperimentIds).toHaveBeenCalledWith([1, 2])
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchUpdateOwners', () => {
    test('updates owners for experiments', () => {
      target.validator.validate = mockResolve()
      dbWrite.owner.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateOwners([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT')
        expect(dbWrite.owner.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.owner.batchUpdate = mockReject(error)

      return target.batchUpdateOwners([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT')
        expect(dbWrite.owner.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.owner.batchUpdate = mock()

      return target.batchUpdateOwners([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testContext)
        expect(dbWrite.owner.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
