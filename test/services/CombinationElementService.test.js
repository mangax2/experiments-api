import { mock, mockReject, mockResolve } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import CombinationElementService from '../../src/services/CombinationElementService'
import db from '../../src/db/DbManager'
import log4js from 'log4js'

describe('CombinationElementService', () => {
  const testContext = {}
  const testTx = { tx: {} }

  beforeAll(() => {
    AppUtil.createPostResponse = mock()
    AppUtil.createPutResponse = mock()
    // AppError.notFound = jest.fn()
    db.combinationElement.respository = mock({ tx: function (transactionName, callback) {return callback(testTx)} })
  })

  afterEach(() => {
    AppUtil.createPostResponse.mockClear()
    AppUtil.createPutResponse.mockClear()
    // AppError.notFound.mockClear()
  })

  afterAll(() => {
    AppUtil.createPostResponse.mockReset()
    AppUtil.createPutResponse.mockReset()
    // AppError.notFound.mockReset()
  })

  describe('batchCreateCombinationElements', () => {
    it('calls combinationElement batchCreate', () => {
      const target = new CombinationElementService()
      target.validator.validate = mockResolve()
      db.combinationElement.batchCreate = mockResolve({})

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.combinationElement.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when combinationElement db call fails', () => {
      const target = new CombinationElementService()
      target.validator.validate = mockResolve()
      db.combinationElement.batchCreate = mockReject('error')

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.combinationElement.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      const target = new CombinationElementService()
      target.validator.validate = mockReject('error')
      db.combinationElement.batchCreate = mock()

      return target.batchCreateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.combinationElement.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getCombinationElementsByTreatmentId', () => {
    it('calls combinationElement findAllByTreatmentId', () => {
      const target = new CombinationElementService()
      target.treatmentService.getTreatmentById = mockResolve()
      db.combinationElement.findAllByTreatmentId = mock()

      return target.getCombinationElementsByTreatmentId(1, testTx).then(() => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, testTx)
        expect(db.combinationElement.findAllByTreatmentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when treatmentService fails', () => {
      const target = new CombinationElementService()
      target.treatmentService.getTreatmentById = mockReject('error')
      db.combinationElement.findAllByTreatmentId = mock()

      return target.getCombinationElementsByTreatmentId(1, testTx).then(() => {}, (err) => {
        expect(target.treatmentService.getTreatmentById).toHaveBeenCalledWith(1, testTx)
        expect(db.combinationElement.findAllByTreatmentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetCombinationElementByTreatmentIds', () => {
    it('calls combinationElement batchFindAllByTreatmentIds', () => {
      const target = new CombinationElementService()
      target.treatmentService.batchGetTreatmentByIds = mockResolve()
      db.combinationElement.batchFindAllByTreatmentIds = mock()

      return target.batchGetCombinationElementsByTreatmentIds([1, 2], testTx).then(() => {}, () => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(db.combinationElement.batchFindAllByTreatmentIds).toHaveBeenCalledWith([1, 2], testTx)
      })
    })

    it('rejects when treatmentService call fails', () => {
      const target = new CombinationElementService()
      target.treatmentService.batchGetTreatmentByIds = mockReject('error')
      db.combinationElement.batchFindAllByTreatmentIds = mock()

      return target.batchGetCombinationElementsByTreatmentIds([1, 2], testTx).then(() => {}, (err) => {
        expect(target.treatmentService.batchGetTreatmentByIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(db.combinationElement.batchFindAllByTreatmentIds).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetCombinationElementsByTreatmentIdsNoValidate', () => {
    it('calls combinationElement batchFindAllByTreatmentIds without calling treatmentService', () => {
      const target = new CombinationElementService()
      target.treatmentService.batchGetTreatmentByIds = mock()
      db.combinationElement.batchFindAllByTreatmentIds = mock()

      target.batchGetCombinationElementsByTreatmentIdsNoValidate([1, 2], testTx)
      expect(target.treatmentService.batchGetTreatmentByIds).not.toHaveBeenCalled()
      expect(db.combinationElement.batchFindAllByTreatmentIds).toHaveBeenCalledWith([1, 2], testTx)
    })
  })

  describe('getCombinationElementById', () => {
    it('returns data when call returns data', () => {
      const target = new CombinationElementService()
      db.combinationElement.find = mockResolve({})

      target.getCombinationElementById(1, testTx).then((data) => {
        expect(db.combinationElement.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when call returns no data', () => {
      const target = new CombinationElementService()
      db.combinationElement.find = mockResolve()
      AppError.notFound = jest.fn(() => { return {} })

      return target.getCombinationElementById(1, testTx).then(() => {}, () => {
        expect(AppError.notFound).toHaveBeenCalledWith('Combination Element Not Found for requested id')
      })
    })

    it('rejects when combinationElement find fails', () => {
      const target = new CombinationElementService()
      db.combinationElement.find = mockReject('error')

      return target.getCombinationElementById(1, testTx).then(() => {}, (err) => {
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateCombinationElements', () => {
    it('calls createPutResponse when validated and updated', () => {
      const target = new CombinationElementService()
      target.validator.validate = mockResolve()
      db.combinationElement.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.combinationElement.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchUpdate call fails', () => {
      const target = new CombinationElementService()
      target.validator.validate = mockResolve()
      db.combinationElement.batchUpdate = mockReject('error')
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.combinationElement.batchUpdate).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate call fails', () => {
      const target = new CombinationElementService()
      target.validator.validate = mockReject('error')
      db.combinationElement.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateCombinationElements([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'PUT', testTx)
        expect(db.combinationElement.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteCombinationElement', () => {
    it('returns data when successfully deletes', () => {
      const target = new CombinationElementService()
      db.combinationElement.remove = mockResolve({})

      return target.deleteCombinationElement(1, testTx).then((data) => {
        expect(db.combinationElement.remove).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when data returned is empty', () => {
      const target = new CombinationElementService()
      db.combinationElement.remove = mockResolve()

      return target.deleteCombinationElement(1, testTx).then(() => {}, () => {
        expect(db.combinationElement.remove).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when combinationElement remove fails', () => {
      const target = new CombinationElementService()
      db.combinationElement.remove = mockReject('error')

      return target.deleteCombinationElement(1, testTx).then(() => {}, (err) => {
        expect(db.combinationElement.remove).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    describe('batchDeleteCombinationElements', () => {
      it('returns data when batchRemove succeeds', () => {
        const target = new CombinationElementService()
        db.combinationElement.batchRemove = mockResolve([1])

        return target.batchDeleteCombinationElements([1], testTx).then((data) => {
          expect(db.combinationElement.batchRemove).toHaveBeenCalledWith([1], testTx)
          expect(data).toEqual([1])
        })
      })

      it('throws an error when there are only null elements', () => {
        const target = new CombinationElementService()
        db.combinationElement.batchRemove = mockResolve([null])
        AppError.notFound = jest.fn()

        return target.batchDeleteCombinationElements([1], testTx).then(() => {}, () => {
          expect(db.combinationElement.batchRemove).toHaveBeenCalledWith([1], testTx)
          expect(AppError.notFound).toHaveBeenCalledWith('Not all combination elements requested' +
            ' for delete were found')
        })
      })

      it('throws an error when returned data does not match input data', () => {
        const target = new CombinationElementService()
        db.combinationElement.batchRemove = mockResolve([1])
        AppError.notFound = jest.fn()

        return target.batchDeleteCombinationElements([1, 2], testTx).then(() => {}, () => {
          expect(db.combinationElement.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
          expect(AppError.notFound).toHaveBeenCalledWith('Not all combination elements requested' +
            ' for delete were found')
        })
      })
    })
  })
})