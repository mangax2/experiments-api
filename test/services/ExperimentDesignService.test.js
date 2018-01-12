import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentDesignService from '../../src/services/ExperimentDesignService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('ExperimentDesignService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.experimentDesign.repository = mock({ tx(transactionName, callback) { return callback(testTx) } })

  beforeEach(() => {
    target = new ExperimentDesignService()
  })

  describe('createExperimentDesign', () => {
    test('calls validate and create', () => {
      target.validator.validate = mockResolve()
      db.experimentDesign.create = mockResolve(1)

      return target.createExperimentDesign({}, testContext).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.create).toHaveBeenCalledWith(testTx, {}, testContext)
        expect(data).toEqual(1)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.experimentDesign.create = mock()

      return target.createExperimentDesign({}, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.create).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllExperimentDesigns', () => {
    test('calls experimentDesign all', () => {
      db.experimentDesign.all = mockResolve([])

      return target.getAllExperimentDesigns().then((data) => {
        expect(db.experimentDesign.all).toHaveBeenCalled()
        expect(data).toEqual([])
      })
    })
  })

  describe('getExperimentDesignById', () => {
    test('returns data from experimentDesign find', () => {
      db.experimentDesign.find = mockResolve({})

      return target.getExperimentDesignById(1).then((data) => {
        expect(db.experimentDesign.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    test('throws an error when data returned is undefined', () => {
      db.experimentDesign.find = mockResolve()
      AppError.notFound = mock()

      return target.getExperimentDesignById(1).then(() => {}, () => {
        expect(db.experimentDesign.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Design Not Found', undefined, '183001')
      })
    })
  })
})
