import { mock, mockResolve, mockReject } from '../jestUtil'
import FactorLevelService from '../../src/services/FactorLevelService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('FactorLevelService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.factorLevel.repository = mock({ tx(transactionName, callback) { return callback(testTx) } })

  beforeEach(() => {
    expect.hasAssertions()
    target = new FactorLevelService()
  })

  describe('batchCreateFactorLevels', () => {
    test('validates, calls batchCreate, and returns postResponse', () => {
      target.validator.validate = mockResolve()
      db.factorLevel.batchCreate = mockResolve([])
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.factorLevel.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.factorLevel.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllFactorLevels', () => {
    test('returns all factorLevels', () => {
      db.factorLevel.all = mockResolve([{}])

      return target.getAllFactorLevels().then((data) => {
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all factorLevels fails', () => {
      const error = { message: 'error' }
      db.factorLevel.all = mockReject(error)

      return target.getAllFactorLevels().then(() => {}, (err) => {
        expect(err).toEqual(error)
      })
    })
  })

  describe('getFactorLevelsByExperimentIdNoExistenceCheck', () => {
    test('finds factors by that id', () => {
      db.factorLevel.findByExperimentId = mockResolve([])

      return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(1, testTx).then((data) => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      db.factorLevel.findByExperimentId = mockReject(error)

      return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(1, testTx).then(() => {}, (err) => {
        expect(db.factorLevel.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })
  describe('batchUpdateFactorLevels', () => {
    test('calls validate, batchUpdate, and returns post response', () => {
      target.validator.validate = mockResolve()
      db.factorLevel.batchUpdate = mockResolve([])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([])
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.factorLevel.batchUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.factorLevel.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchDeleteFactorLevels', () => {
    test('calls factorLevel batchRemove and returns data', () => {
      db.factorLevel.batchRemove = mockResolve([1, 2])

      return target.batchDeleteFactorLevels([1, 2], {}, testTx).then((data) => {
        expect(db.factorLevel.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })

    test('throws an error when remove returns array whose length mismatches input', () => {
      db.factorLevel.batchRemove = mockResolve([null, 1])
      AppError.notFound = mock()

      return target.batchDeleteFactorLevels([1, 2], {}, testTx).then(() => {}, () => {
        expect(db.factorLevel.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all factor levels requested for delete were found', undefined, '1C7001')
      })
    })
  })
})
