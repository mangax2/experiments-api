import { mock, mockReject, mockResolve } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import CombinationElementService from '../../src/services/CombinationElementService'
import db from '../../src/db/DbManager'

describe('CombinationElementService', () => {
  const testContext = {}
  const testTx = { tx: {} }
  let target
  db.combinationElement.respository = mock({ tx(transactionName, callback) { return callback(testTx) } })

  beforeEach(() => {
    expect.hasAssertions()
    target = new CombinationElementService()
  })

  describe('batchCreateCombinationElements', () => {
    test('calls combinationElement batchCreate', () => {
      target.validator.validate = mockResolve()
      db.combinationElement.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.combinationElement.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when combinationElement db call fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.combinationElement.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.combinationElement.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.combinationElement.batchCreate = mock()

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.combinationElement.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getCombinationElementsByExperimentId', () => {
    test('calls findAllByExperimentId', () => {
      db.combinationElement.findAllByExperimentId = mockResolve()

      return target.getCombinationElementsByExperimentId(1, testTx).then(() => {
        expect(db.combinationElement.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    test('rejects when findAllByExperimentId fails', () => {
      const error = { message: 'error' }
      db.combinationElement.findAllByExperimentId = mockReject(error)

      return target.getCombinationElementsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(db.combinationElement.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchGetCombinationElementByTreatmentIds', () => {
    test('calls combinationElement batchFindAllByTreatmentIds', () => {
      target.treatmentService.batchGetTreatmentByIds = mockResolve()
      db.combinationElement.batchFindAllByTreatmentIds = mockResolve()

      return target.batchGetCombinationElementsByTreatmentIds([1, 2], {}, testTx).then(() => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith([1, 2], {}, testTx)
        expect(db.combinationElement.batchFindAllByTreatmentIds).toHaveBeenCalledWith([1, 2], testTx)
      })
    })

    test('rejects when treatmentService call fails', () => {
      const error = { message: 'error' }
      target.treatmentService.batchGetTreatmentByIds = mockReject(error)
      db.combinationElement.batchFindAllByTreatmentIds = mock()

      return target.batchGetCombinationElementsByTreatmentIds([1, 2], {}, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith([1, 2], {}, testTx)
        expect(db.combinationElement.batchFindAllByTreatmentIds).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchGetCombinationElementsByTreatmentIdsNoValidate', () => {
    test('calls combinationElement batchFindAllByTreatmentIds without calling treatmentService', () => {
      target.treatmentService.batchGetTreatmentByIds = mock()
      db.combinationElement.batchFindAllByTreatmentIds = mockResolve()

      return target.batchGetCombinationElementsByTreatmentIdsNoValidate([1, 2], testTx).then(() => {
        expect(target.treatmentService.batchGetTreatmentByIds).not.toHaveBeenCalled()
        expect(db.combinationElement.batchFindAllByTreatmentIds).toHaveBeenCalledWith([1, 2], testTx)
      })
    })
  })
  describe('batchUpdateCombinationElements', () => {
    test('calls createPutResponse when validated and updated', () => {
      target.validator.validate = mockResolve()
      db.combinationElement.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.combinationElement.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate call fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.combinationElement.batchUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.combinationElement.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate call fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.combinationElement.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.combinationElement.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchDeleteCombinationElements', () => {
    test('returns data when batchRemove succeeds', () => {
      db.combinationElement.batchRemove = mockResolve([1])

      return target.batchDeleteCombinationElements([1], {}, testTx).then((data) => {
        expect(db.combinationElement.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    test('throws an error when there are only null elements', () => {
      db.combinationElement.batchRemove = mockResolve([null])
      AppError.notFound = jest.fn()

      return target.batchDeleteCombinationElements([1], {}, testTx).then(() => {}, () => {
        expect(db.combinationElement.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all combination elements requested for delete were found', undefined, '118001')
      })
    })

    test('throws an error when returned data does not match input data', () => {
      db.combinationElement.batchRemove = mockResolve([1])
      AppError.notFound = jest.fn()

      return target.batchDeleteCombinationElements([1, 2], {}, testTx).then(() => {}, () => {
        expect(db.combinationElement.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all combination elements requested for delete were found', undefined, '118001')
      })
    })
  })
})
