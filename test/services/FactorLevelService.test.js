import { mock, mockResolve, mockReject } from '../jestUtil'
import FactorLevelService from '../../src/services/FactorLevelService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('FactorLevelService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.factorLevel.repository = mock({ tx: function (transactionName, callback) {return callback(testTx)} })

  beforeEach(() => {
    target = new FactorLevelService()
  })

  describe('batchCreateFactorLevels', () => {
    it('validates, calls batchCreate, and returns postResponse', () => {
      target.validator.validate = mockResolve()
      db.factorLevel.batchCreate = mockResolve([])
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([])
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.factorLevel.batchCreate = mockReject('error')
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.factorLevel.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevel.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getAllFactorLevels', () => {
    it('returns all factorLevels', () => {
      db.factorLevel.all = mockResolve([{}])

      return target.getAllFactorLevels().then((data) => {
        expect(data).toEqual([{}])
      })
    })

    it('rejects when get all factorLevels fails', () => {
      db.factorLevel.all = mockReject('error')

      return target.getAllFactorLevels().then(() => {}, (err) => {
        expect(err).toEqual('error')
      })
    })
  })

  describe('getFactorLevelsByFactorId', () => {
    it('calls getFactorById and findByFactorId', () => {
      target.factorService.getFactorById = mockResolve()
      db.factorLevel.findByFactorId = mockResolve([{}])

      return target.getFactorLevelsByFactorId(1).then((data) => {
        expect(target.factorService.getFactorById).toHaveBeenCalledWith(1)
        expect(db.factorLevel.findByFactorId).toHaveBeenCalledWith(1)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when findByFactorId fails', () => {
      target.factorService.getFactorById = mockResolve()
      db.factorLevel.findByFactorId = mockReject('error')

      return target.getFactorLevelsByFactorId(1).then(() => {}, (err) => {
        expect(target.factorService.getFactorById).toHaveBeenCalledWith(1)
        expect(db.factorLevel.findByFactorId).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getFactorById fails', () => {
      target.factorService.getFactorById = mockReject('error')
      db.factorLevel.findByFactorId = mock()

      return target.getFactorLevelsByFactorId(1).then(() => {}, (err) => {
        expect(target.factorService.getFactorById).toHaveBeenCalledWith(1)
        expect(db.factorLevel.findByFactorId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getFactorLevelById', () => {
    it('returns data from find', () => {
      db.factorLevel.find = mockResolve({})

      return target.getFactorLevelById(1).then((data) => {
        expect(db.factorLevel.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when no data is returned', () => {
      db.factorLevel.find = mockResolve()
      AppError.notFound = mock()

      return target.getFactorLevelById(1).then(() => {}, () => {
        expect(db.factorLevel.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Factor Level Not Found for requested id')
      })
    })

    it('rejects when factorLevel find fails', () => {
      db.factorLevel.find = mockReject('error')

      return target.getFactorLevelById(1).then(() => {}, (err) => {
        expect(db.factorLevel.find).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateFactorLevels', () => {
    it('calls validate, batchUpdate, and returns post response', () => {
      target.validator.validate = mockResolve()
      db.factorLevel.batchUpdate = mockResolve([])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([])
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.factorLevel.batchUpdate = mockReject('error')
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.factorLevel.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactorLevels([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factorLevel.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteFactorLevel', () => {
    it('calls factorLevel remove and returns data', () => {
      db.factorLevel.remove = mockResolve([])

      return target.deleteFactorLevel(1).then((data) => {
        expect(db.factorLevel.remove).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })

    it('throws an error when remove returns no data', () => {
      db.factorLevel.remove = mockResolve()
      AppError.notFound = mock()

      return target.deleteFactorLevel(1).then(() => {}, () => {
        expect(db.factorLevel.remove).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Factor Level Not Found for requested id')
      })
    })
  })

  describe('batchDeleteFactorLevels', () => {
    it('calls factorLevel batchRemove and returns data', () => {
      db.factorLevel.batchRemove = mockResolve([1,2])

      return target.batchDeleteFactorLevels([1,2], testTx).then((data) => {
        expect(db.factorLevel.batchRemove).toHaveBeenCalledWith([1,2], testTx)
        expect(data).toEqual([1,2])
      })
    })

    it('throws an error when remove returns array whose length mismatches input', () => {
      db.factorLevel.batchRemove = mockResolve([null, 1])
      AppError.notFound = mock()

      return target.batchDeleteFactorLevels([1,2], testTx).then(() => {}, () => {
        expect(db.factorLevel.batchRemove).toHaveBeenCalledWith([1,2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all factor levels requested for delete were found')
      })
    })
  })
})