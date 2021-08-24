import { mock, mockReject, mockResolve } from '../jestUtil'
import DependentVariableService from '../../src/services/DependentVariableService'
import AppUtil from '../../src/services/utility/AppUtil'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('DependentVariableService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new DependentVariableService()
  })

  describe('batchCreateDependentVariables', () => {
    test('calls validate, batchCreate, and AppUtil on success', () => {
      target.validator.validate = mockResolve()
      dbWrite.dependentVariable.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.dependentVariable.batchCreate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.dependentVariable.batchCreate = mockReject(error)
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.dependentVariable.batchCreate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.dependentVariable.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.dependentVariable.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
  describe('getDependentVariablesByExperimentId', () => {
    test('calls getExperimentById and findByExperimentId', () => {
      target.experimentService.getExperimentById = mockResolve()
      dbRead.dependentVariable.findByExperimentId = mockResolve()

      return target.getDependentVariablesByExperimentId(1, false, testContext, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext)
        expect(dbRead.dependentVariable.findByExperimentId).toHaveBeenCalledWith(1)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      dbRead.dependentVariable.findByExperimentId = mock()

      return target.getDependentVariablesByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext)
        expect(dbRead.dependentVariable.findByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getDependentVariablesByExperimentIdNoExistenceCheck', () => {
    test('calls dependentVariable findByExperimentId', () => {
      dbRead.dependentVariable.findByExperimentId = mockResolve()

      return DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck(1).then(() => {
        expect(dbRead.dependentVariable.findByExperimentId).toHaveBeenCalledWith(1)
      })
    })
  })
  describe('batchUpdateDependentVariables', () => {
    test('calls validate, batchUpdate, and createPutResponse', () => {
      target.validator.validate = mockResolve()
      dbWrite.dependentVariable.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext, testTx).then(() => {
        expect(dbWrite.dependentVariable.batchUpdate).toHaveBeenCalled()
        expect(target.validator.validate).toHaveBeenCalled()
        expect(AppUtil.createPutResponse).toHaveBeenCalled()
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.dependentVariable.batchUpdate = mockReject(error)
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext, testTx).then(() => {}, (err) => {
        expect(dbWrite.dependentVariable.batchUpdate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(target.validator.validate).toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.dependentVariable.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalled()
        expect(dbWrite.dependentVariable.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('deleteDependentVariablesForExperimentId', () => {
    test('calls removeByExperimentId', () => {
      target.experimentService.getExperimentById = mockResolve()
      dbWrite.dependentVariable.removeByExperimentId = mockResolve()

      return target.deleteDependentVariablesForExperimentId(1, false, testContext, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext)
        expect(dbWrite.dependentVariable.removeByExperimentId).toHaveBeenCalledWith(testTx, 1)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      dbWrite.dependentVariable.removeByExperimentId = mock()

      return target.deleteDependentVariablesForExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext)
        expect(dbWrite.dependentVariable.removeByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
