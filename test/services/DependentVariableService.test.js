import { mock, mockReject, mockResolve } from '../jestUtil'
import DependentVariableService from '../../src/services/DependentVariableService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('DependentVariableService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.dependentVariable.repository = mock({ tx: function (transactionName, callback) {return callback(testTx)} })

  beforeEach(() => {
    target = new DependentVariableService()
  })

  describe('batchCreateDependentVariables', () => {
    it('calls validate, batchCreate, and AppUtil on success', () => {
      target.validator.validate = mockResolve()
      db.dependentVariable.batchCreate = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.dependentVariable.batchCreate = mockReject('error')
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.dependentVariable.batchCreate = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getAllDependentVariables', () => {
    it('calls dependentVariable all', () => {
      db.dependentVariable.all = mockResolve()

      return target.getAllDependentVariables().then(() => {
        expect(db.dependentVariable.all).toHaveBeenCalled()
      })
    })
  })

  describe('getDependentVariablesByExperimentId', () => {
    it('calls getExperimentById and findByExperimentId', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.dependentVariable.findByExperimentId = mockResolve()

      return target.getDependentVariablesByExperimentId(1,false, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1,false, testTx)
        expect(db.dependentVariable.findByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.dependentVariable.findByExperimentId = mock()

      return target.getDependentVariablesByExperimentId(1,false, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1,false, testTx)
        expect(db.dependentVariable.findByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getDependentVariablesByExperimentIdNoExistenceCheck', () => {
    it('calls dependentVariable findByExperimentId', () => {
      db.dependentVariable.findByExperimentId = mockResolve()

      return DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck(1, testTx).then(() => {
        expect(db.dependentVariable.findByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })
  })

  describe('getDependentVariableById', () => {
    it('calls dependentVariable find', () => {
      db.dependentVariable.find = mockResolve({})

      return target.getDependentVariableById(1).then(() => {
        expect(db.dependentVariable.find).toHaveBeenCalledWith(1)
      })
    })

    it('throws an error when data is undefined', () => {
      db.dependentVariable.find = mockResolve()
      AppError.notFound = mock()

      return target.getDependentVariableById(1).then(() => {}, () => {
        expect(db.dependentVariable.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Dependent Variable Not Found for' +
          ' requested id')
      })
    })

    it('rejects when dependentVariable find fails', () => {
      db.dependentVariable.find = mockReject('error')
      AppError.notFound = mock()

      return target.getDependentVariableById(1).then(() => {}, (err) => {
        expect(db.dependentVariable.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateDependentVariables', () => {
    it('calls validate, batchUpdate, and createPutResponse', () => {
      target.validator.validate = mockResolve()
      db.dependentVariable.batchUpdate = mockResolve({})
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext).then(() => {
        expect(db.dependentVariable.batchUpdate).toHaveBeenCalled()
        expect(target.validator.validate).toHaveBeenCalled()
        expect(AppUtil.createPutResponse).toHaveBeenCalled()
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.dependentVariable.batchUpdate = mockReject('error')
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext).then(() => {}, (err) => {
        expect(db.dependentVariable.batchUpdate).toHaveBeenCalled()
        expect(target.validator.validate).toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.dependentVariable.batchUpdate = mock()
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDependentVariables([], testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalled()
        expect(db.dependentVariable.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteDependentVariable', () => {
    it('successfully calls remove', () => {
      db.dependentVariable.remove = mockResolve({})

      return target.deleteDependentVariable(1).then((data) => {
        expect(data).toEqual({})
        expect(db.dependentVariable.remove).toHaveBeenCalledWith(1)
      })
    })

    it('throws an error when data is undefined after removing', () => {
      db.dependentVariable.remove = mockResolve()
      AppError.notFound = mock()

      return target.deleteDependentVariable(1).then(() => {}, () => {
        expect(db.dependentVariable.remove).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Dependent Variable Not Found for' +
          ' requested id')
      })
    })

    it('rejects when remove call fails', () => {
      db.dependentVariable.remove = mockReject('error')
      AppError.notFound = mock()

      return target.deleteDependentVariable(1).then(() => {}, (err) => {
        expect(db.dependentVariable.remove).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteDependentVariablesForExperimentId', () => {
    it('calls removeByExperimentId', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.dependentVariable.removeByExperimentId = mockResolve()

      return target.deleteDependentVariablesForExperimentId(1,false, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1,false, testTx)
        expect(db.dependentVariable.removeByExperimentId).toHaveBeenCalledWith(testTx, 1)
      })
    })

    it('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.dependentVariable.removeByExperimentId = mock()

      return target.deleteDependentVariablesForExperimentId(1,false, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1,false, testTx)
        expect(db.dependentVariable.removeByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})