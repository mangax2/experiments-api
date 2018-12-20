import { mock, mockReject, mockResolve } from '../jestUtil'
import DependentVariableService from '../../src/services/DependentVariableService'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'

describe('DependentVariableService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.dependentVariable.repository = mock({ tx(transactionName, callback) { return callback(testTx) } })

  beforeEach(() => {
    expect.hasAssertions()
    target = new DependentVariableService()
  })

  describe('batchCreateDependentVariables', () => {
    test('calls validate, batchCreate, and AppUtil on success', () => {
      target.validator.validate = mockResolve()
      db.dependentVariable.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.dependentVariable.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.dependentVariable.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
  describe('getDependentVariablesByExperimentId', () => {
    test('calls getExperimentById and findByExperimentId', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.dependentVariable.findByExperimentId = mockResolve()

      return target.getDependentVariablesByExperimentId(1, false, testContext, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.dependentVariable.findByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      db.dependentVariable.findByExperimentId = mock()

      return target.getDependentVariablesByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.dependentVariable.findByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getDependentVariablesByExperimentIdNoExistenceCheck', () => {
    test('calls dependentVariable findByExperimentId', () => {
      db.dependentVariable.findByExperimentId = mockResolve()

      return DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck(1, testTx).then(() => {
        expect(db.dependentVariable.findByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })
  })
  describe('batchUpdateDependentVariables', () => {
    test('calls validate, batchUpdate, and createPutResponse', () => {
      target.validator.validate = mockResolve()
      db.dependentVariable.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext).then(() => {
        expect(db.dependentVariable.batchUpdate).toHaveBeenCalled()
        expect(target.validator.validate).toHaveBeenCalled()
        expect(AppUtil.createPutResponse).toHaveBeenCalled()
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.dependentVariable.batchUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext).then(() => {}, (err) => {
        expect(db.dependentVariable.batchUpdate).toHaveBeenCalled()
        expect(target.validator.validate).toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.dependentVariable.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalled()
        expect(db.dependentVariable.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('deleteDependentVariablesForExperimentId', () => {
    test('calls removeByExperimentId', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.dependentVariable.removeByExperimentId = mockResolve()

      return target.deleteDependentVariablesForExperimentId(1, false, testContext, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.dependentVariable.removeByExperimentId).toHaveBeenCalledWith(testTx, 1)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      db.dependentVariable.removeByExperimentId = mock()

      return target.deleteDependentVariablesForExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.dependentVariable.removeByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
