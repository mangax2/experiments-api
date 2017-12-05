import { mock, mockReject, mockResolve } from '../jestUtil'
import FactorService from '../../src/services/FactorService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('FactorService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new FactorService()
  })

  describe('batchCreateFactors', () => {
    it('validates, calls batchCreate, and returns postResponse', () => {
      target.validator.validate = mockResolve()
      db.factor.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactors([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.factor.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.factor.batchCreate = mockReject('error')
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactors([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.factor.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.factor.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactors([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.factor.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getAllFactors', () => {
    it('returns factors', () => {
      db.factor.all = mockResolve([{}])

      return target.getAllFactors(testTx).then((data) => {
        expect(db.factor.all).toHaveBeenCalledWith(testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when get all call fails', () => {
      db.factor.all = mockReject('error')

      return target.getAllFactors(testTx).then(() => {}, (err) => {
        expect(db.factor.all).toHaveBeenCalledWith(testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getFactorsByExperimentId', () => {
    it('gets an experiment, and finds factors by that id', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.factor.findByExperimentId = mockResolve([])

      return target.getFactorsByExperimentId(1, false, testContext, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.factor.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([])
      })
    })

    it('rejects when findByExperimentId fails', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.factor.findByExperimentId = mockReject('error')

      return target.getFactorsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.factor.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.factor.findByExperimentId = mockReject('error')

      return target.getFactorsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.factor.findByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getFactorsByExperimentIdNoExistenceCheck', () => {
    it('finds factors by that id', () => {
      db.factor.findByExperimentId = mockResolve([])

      return FactorService.getFactorsByExperimentIdNoExistenceCheck(1, testTx).then((data) => {
        expect(db.factor.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([])
      })
    })

    it('rejects when findByExperimentId fails', () => {
      db.factor.findByExperimentId = mockReject('error')

      return FactorService.getFactorsByExperimentIdNoExistenceCheck(1, testTx).then(() => {}, (err) => {
        expect(db.factor.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getFactorById', () => {
    it('returns factor found by id', () => {
      db.factor.find = mockResolve({})

      return target.getFactorById(1, {}, testTx).then((data) => {
        expect(db.factor.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when no data is returned', () => {
      db.factor.find = mockResolve()
      AppError.notFound = mock()

      return target.getFactorById(1, {}, testTx).then(() => {}, () => {
        expect(db.factor.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Factor Not Found for requested id')
      })
    })

    it('rejects when factor find fails', () => {
      db.factor.find = mockReject('error')
      AppError.notFound = mock()

      return target.getFactorById(1, {}, testTx).then(() => {}, (err) => {
        expect(db.factor.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateFactors', () => {
    it('validates, batchUpdates and returns put resposne', () => {
      target.validator.validate = mockResolve()
      db.factor.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactors([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factor.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.factor.batchUpdate = mockReject('error')

      return target.batchUpdateFactors([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factor.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.factor.batchUpdate = mockReject('error')

      return target.batchUpdateFactors([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.factor.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchDeleteFactors', () => {
    it('calls factor batchRemove and returns data', () => {
      db.factor.batchRemove = mockResolve([1,2])

      return target.batchDeleteFactors([1,2], {}, testTx).then((data) => {
        expect(db.factor.batchRemove).toHaveBeenCalledWith([1,2], testTx)
        expect(data).toEqual([1,2])
      })
    })

    it('throws an error when remove returns array whose length mismatches input', () => {
      db.factor.batchRemove = mockResolve([null, 1])
      AppError.notFound = mock()

      return target.batchDeleteFactors([1,2], {}, testTx).then(() => {}, () => {
        expect(db.factor.batchRemove).toHaveBeenCalledWith([1,2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all factors requested for delete were found')
      })
    })
  })
})