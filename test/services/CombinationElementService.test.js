import { mock, mockReject, mockResolve } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import CombinationElementService from '../../src/services/CombinationElementService'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('CombinationElementService', () => {
  const testContext = {}
  const testTx = { tx: {} }
  let target

  beforeEach(() => {
    target = new CombinationElementService()
  })

  describe('batchCreateCombinationElements', () => {
    test('calls combinationElement batchCreate', () => {
      target.validator.validate = mockResolve()
      dbWrite.combinationElement.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.combinationElement.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when combinationElement db call fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.combinationElement.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.combinationElement.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.combinationElement.batchCreate = mock()

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.combinationElement.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getCombinationElementsByExperimentId', () => {
    test('calls findAllByExperimentId', () => {
      dbRead.combinationElement.findAllByExperimentId = mockResolve()

      return target.getCombinationElementsByExperimentId(1).then(() => {
        expect(dbRead.combinationElement.findAllByExperimentId).toHaveBeenCalledWith(1)
      })
    })

    test('rejects when findAllByExperimentId fails', () => {
      const error = { message: 'error' }
      dbRead.combinationElement.findAllByExperimentId = mockReject(error)

      return target.getCombinationElementsByExperimentId(1).then(() => {}, (err) => {
        expect(dbRead.combinationElement.findAllByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchGetCombinationElementByTreatmentIds', () => {
    test('calls combinationElement batchFindAllByTreatmentIds', () => {
      target.treatmentService.batchGetTreatmentByIds = mockResolve()
      dbRead.combinationElement.batchFindAllByTreatmentIds = mockResolve()

      return target.batchGetCombinationElementsByTreatmentIds([1, 2], {}).then(() => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith([1, 2], {})
        expect(dbRead.combinationElement.batchFindAllByTreatmentIds).toHaveBeenCalledWith([1, 2])
      })
    })

    test('rejects when treatmentService call fails', () => {
      const error = { message: 'error' }
      target.treatmentService.batchGetTreatmentByIds = mockReject(error)
      dbRead.combinationElement.batchFindAllByTreatmentIds = mock()

      return target.batchGetCombinationElementsByTreatmentIds([1, 2], {}).then(() => {}, (err) => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith([1, 2], {})
        expect(dbRead.combinationElement.batchFindAllByTreatmentIds).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchGetCombinationElementsByTreatmentIdsNoValidate', () => {
    test('calls combinationElement batchFindAllByTreatmentIds without calling treatmentService', () => {
      target.treatmentService.batchGetTreatmentByIds = mock()
      dbRead.combinationElement.batchFindAllByTreatmentIds = mockResolve()

      return target.batchGetCombinationElementsByTreatmentIdsNoValidate([1, 2]).then(() => {
        expect(target.treatmentService.batchGetTreatmentByIds).not.toHaveBeenCalled()
        expect(dbRead.combinationElement.batchFindAllByTreatmentIds).toHaveBeenCalledWith([1, 2])
      })
    })
  })
  describe('batchUpdateCombinationElements', () => {
    test('calls createPutResponse when validated and updated', () => {
      target.validator.validate = mockResolve()
      dbWrite.combinationElement.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT')
        expect(dbWrite.combinationElement.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchUpdate call fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.combinationElement.batchUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT')
        expect(dbWrite.combinationElement.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate call fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.combinationElement.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT')
        expect(dbWrite.combinationElement.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchDeleteCombinationElements', () => {
    test('returns data when batchRemove succeeds', () => {
      dbWrite.combinationElement.batchRemove = mockResolve([1])

      return target.batchDeleteCombinationElements([1], {}, testTx).then((data) => {
        expect(dbWrite.combinationElement.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    test('throws an error when there are only null elements', () => {
      dbWrite.combinationElement.batchRemove = mockResolve([null])
      AppError.notFound = jest.fn()

      return target.batchDeleteCombinationElements([1], {}, testTx).then(() => {}, () => {
        expect(dbWrite.combinationElement.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all combination elements requested for delete were found', undefined, '118001')
      })
    })

    test('throws an error when returned data does not match input data', () => {
      dbWrite.combinationElement.batchRemove = mockResolve([1])
      AppError.notFound = jest.fn()

      return target.batchDeleteCombinationElements([1, 2], {}, testTx).then(() => {}, () => {
        expect(dbWrite.combinationElement.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all combination elements requested for delete were found', undefined, '118001')
      })
    })
  })
})
