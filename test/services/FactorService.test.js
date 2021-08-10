import { mock, mockReject, mockResolve } from '../jestUtil'
import FactorService from '../../src/services/FactorService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('FactorService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new FactorService()
  })

  describe('batchCreateFactors', () => {
    test('validates, calls batchCreate, and returns postResponse', () => {
      target.validator.validate = mockResolve()
      dbWrite.factor.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactors([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.factor.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.factor.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactors([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.factor.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.factor.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactors([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.factor.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllFactors', () => {
    test('returns factors', () => {
      dbRead.factor.all = mockResolve([{}])

      return target.getAllFactors().then((data) => {
        expect(dbRead.factor.all).toHaveBeenCalledWith()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all call fails', () => {
      const error = { message: 'error' }
      dbRead.factor.all = mockReject(error)

      return target.getAllFactors().then(() => {}, (err) => {
        expect(dbRead.factor.all).toHaveBeenCalledWith()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getFactorsByExperimentId', () => {
    test('gets an experiment, and finds factors by that id', () => {
      dbRead.experiments.find = mockResolve({})
      dbRead.factor.findByExperimentId = mockResolve([])

      return target.getFactorsByExperimentId(1, false, testContext).then((data) => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(dbRead.factor.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.experiments.find = mockResolve({})
      dbRead.factor.findByExperimentId = mockReject(error)

      return target.getFactorsByExperimentId(1, false, testContext).then(() => {}, (err) => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(dbRead.factor.findByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      dbRead.experiments.find = mockResolve()
      dbRead.factor.findByExperimentId = mockReject(error)

      return target.getFactorsByExperimentId(1, false, testContext).then(() => {}, () => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(dbRead.factor.findByExperimentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('getFactorsByExperimentIdNoExistenceCheck', () => {
    test('finds factors by that id', () => {
      dbRead.factor.findByExperimentId = mockResolve([])

      return FactorService.getFactorsByExperimentIdNoExistenceCheck(1).then((data) => {
        expect(dbRead.factor.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })

    test('rejects when findByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.factor.findByExperimentId = mockReject(error)

      return FactorService.getFactorsByExperimentIdNoExistenceCheck(1).then(() => {}, (err) => {
        expect(dbRead.factor.findByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })
  describe('batchUpdateFactors', () => {
    test('validates, batchUpdates and returns put resposne', () => {
      target.validator.validate = mockResolve()
      dbWrite.factor.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateFactors([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.factor.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.factor.batchUpdate = mockReject(error)

      return target.batchUpdateFactors([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.factor.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.factor.batchUpdate = mockReject(error)

      return target.batchUpdateFactors([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.factor.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchDeleteFactors', () => {
    test('calls factor batchRemove and returns data', () => {
      dbWrite.factor.batchRemove = mockResolve([1, 2])

      return target.batchDeleteFactors([1, 2], {}, testTx).then((data) => {
        expect(dbWrite.factor.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })

    test('throws an error when remove returns array whose length mismatches input', () => {
      dbWrite.factor.batchRemove = mockResolve([null, 1])
      AppError.notFound = mock()

      return target.batchDeleteFactors([1, 2], {}, testTx).then(() => {}, () => {
        expect(dbWrite.factor.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all factors requested for delete were found', undefined, '1D7001')
      })
    })
  })

  describe('updateFactorsForDesign', () => {
    test('calls removeTiersForExperiment when there is no split', () => {
      dbWrite.factor.removeTiersForExperiment = mockResolve()

      return target.updateFactorsForDesign(1, { rules: {} }, testTx).then(() => {
        expect(dbWrite.factor.removeTiersForExperiment).toHaveBeenCalledWith(1, testTx)
      })
    })

    test('does not call removeTiersForExperiment when there is splits', () => {
      dbWrite.factor.removeTiersForExperiment = mockResolve()

      return target.updateFactorsForDesign(1, { rules: { grouping: { min: 1, max: 10 } } }, testTx).then(() => {
        expect(dbWrite.factor.removeTiersForExperiment).not.toHaveBeenCalled()
      })
    })
  })
})
