import { mock, mockResolve, mockReject } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import OwnerService from '../../src/services/OwnerService'
import db from '../../src/db/DbManager'

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
      db.owner.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateOwners([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx, testContext)
        expect(db.owner.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.owner.batchCreate = mockReject('error')

      return target.batchCreateOwners([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx, testContext)
        expect(db.owner.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    test('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.owner.batchCreate = mock()

      return target.batchCreateOwners([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx, testContext)
        expect(db.owner.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getOwnersByExperimentId', () => {
    test('returns owners for an experimentId', () => {
      db.owner.findByExperimentId = mockResolve(['test'])

      return target.getOwnersByExperimentId(1, testTx).then((data) => {
        expect(db.owner.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual(['test'])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      db.owner.findByExperimentId = mockReject('error')

      return target.getOwnersByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(db.owner.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getOwnersByExperimentIds', () => {
    test('returns owners for passed in ids', () => {
      db.owner.batchFindByExperimentIds = mockResolve([])

      return target.getOwnersByExperimentIds([1, 2], testTx).then(() => {
        expect(db.owner.batchFindByExperimentIds).toHaveBeenCalledWith([1, 2], testTx)
      })
    })

    test('rejects when batchFindByExperimentIds fails', () => {
      db.owner.batchFindByExperimentIds = mockReject('error')

      return target.getOwnersByExperimentIds([1, 2], testTx).then(() => {}, (err) => {
        expect(db.owner.batchFindByExperimentIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateOwners', () => {
    test('updates owners for experiments', () => {
      target.validator.validate = mockResolve()
      db.owner.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateOwners([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx, testContext)
        expect(db.owner.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.owner.batchUpdate = mockReject('error')

      return target.batchUpdateOwners([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx, testContext)
        expect(db.owner.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    test('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.owner.batchUpdate = mock()

      return target.batchUpdateOwners([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx, testContext)
        expect(db.owner.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})
