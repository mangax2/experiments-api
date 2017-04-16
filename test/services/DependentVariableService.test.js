import DependentVariableService from '../../src/services/DependentVariableService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('DependentVariableService', () => {
  const testContext = {}
  const testTx = { tx: {} }

  db.dependentVariable.repository = jest.fn(() => {
    return { tx: function (transactionName, callback) {return callback(testTx)} }
  })

  describe('batchCreateDependentVariables', () => {
    it('calls validate, batchCreate, and AppUtil on success', () => {
      const target = new DependentVariableService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.dependentVariable.batchCreate = jest.fn(() => Promise.resolve({}))
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith({})
      })
    })

    it('rejects when batchCreate fails', () => {
      const target = new DependentVariableService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.dependentVariable.batchCreate = jest.fn(() => Promise.reject('error'))
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).toHaveBeenCalledWith(testTx, [], testContext)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
      })
    })

    it('rejects when validate fails', () => {
      const target = new DependentVariableService()
      target.validator.validate = jest.fn(() => Promise.reject('error'))
      db.dependentVariable.batchCreate = jest.fn()
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateDependentVariables([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.dependentVariable.batchCreate).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
      })
    })
  })

  describe('getAllDependentVariables', () => {
    it('calls dependentVariable all', () => {
      const target = new DependentVariableService()
      db.dependentVariable.all = jest.fn(() => Promise.resolve())

      return target.getAllDependentVariables().then(() => {
        expect(db.dependentVariable.all).toHaveBeenCalled()
      })
    })
  })

  describe('getDependentVariablesByExperimentId', () => {
    it('calls getExperimentById and findByExperimentId', () => {
      const target = new DependentVariableService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.resolve())
      db.dependentVariable.findByExperimentId = jest.fn(() => Promise.resolve())

      return target.getDependentVariablesByExperimentId(1).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1)
        expect(db.dependentVariable.findByExperimentId).toHaveBeenCalledWith(1)
      })
    })

    it('rejects when getExperimentById fails', () => {
      const target = new DependentVariableService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.reject())
      db.dependentVariable.findByExperimentId = jest.fn()

      return target.getDependentVariablesByExperimentId(1).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1)
        expect(db.dependentVariable.findByExperimentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('getDependentVariableById', () => {
    it('calls dependentVariable find', () => {
      const target = new DependentVariableService()
      db.dependentVariable.find = jest.fn(() => Promise.resolve({}))

      return target.getDependentVariableById(1).then(() => {
        expect(db.dependentVariable.find).toHaveBeenCalledWith(1)
      })
    })

    it('throws an error when data is undefined', () => {
      const target = new DependentVariableService()
      db.dependentVariable.find = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

      return target.getDependentVariableById(1).then(() => {}, () => {
        expect(db.dependentVariable.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Dependent Variable Not Found for' +
          ' requested id')
      })
    })

    it('rejects when dependentVariable find fails', () => {
      const target = new DependentVariableService()
      db.dependentVariable.find = jest.fn(() => Promise.reject('error'))
      AppError.notFound = jest.fn()

      return target.getDependentVariableById(1).then(() => {}, () => {
        expect(db.dependentVariable.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).not.toHaveBeenCalled()
      })
    })
  })

  describe('batchUpdateDependentVariables', () => {
    it('calls validate, batchUpdate, and createPutResponse', () => {
      const target = new DependentVariableService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.dependentVariable.batchUpdate = jest.fn(() => Promise.resolve({}))
      AppUtil.createPutResponse = jest.fn()

      return target.batchUpdateDependentVariables([], testContext).then(() => {
        expect(db.dependentVariable.batchUpdate).toHaveBeenCalled()
        expect(target.validator.validate).toHaveBeenCalled()
        expect(AppUtil.createPutResponse).toHaveBeenCalled()
      })
    })

    it('rejects when batchUpdate fails', () => {
      const target = new DependentVariableService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.dependentVariable.batchUpdate = jest.fn(() => Promise.reject(''))
      AppUtil.createPutResponse = jest.fn()

      return target.batchUpdateDependentVariables([], testContext).then(() => {}, () => {
        expect(db.dependentVariable.batchUpdate).toHaveBeenCalled()
        expect(target.validator.validate).toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
      })
    })

    it('rejects when validate fails', () => {
      const target = new DependentVariableService()
      target.validator.validate = jest.fn(() => Promise.reject(''))
      db.dependentVariable.batchUpdate = jest.fn()
      AppUtil.createPutResponse = jest.fn()

      return target.batchUpdateDependentVariables([], testContext).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalled()
        expect(db.dependentVariable.batchUpdate).not.toHaveBeenCalled()
        expect(AppUtil.createPutResponse).not.toHaveBeenCalled()
      })
    })
  })

  describe('deleteDependentVariable', () => {
    it('sucessfully calls remove', () => {
      const target = new DependentVariableService()
      db.dependentVariable.remove = jest.fn(() => Promise.resolve({}))

      return target.deleteDependentVariable(1).then((data) => {
        expect(data).toEqual({})
        expect(db.dependentVariable.remove).toHaveBeenCalledWith(1)
      })
    })

    it('throws an error when data is undefined after removing', () => {
      const target = new DependentVariableService()
      db.dependentVariable.remove = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

      return target.deleteDependentVariable(1).then(() => {}, () => {
        expect(db.dependentVariable.remove).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Dependent Variable Not Found for' +
          ' requested id')
      })
    })

    it('rejects when remove call fails', () => {
      const target = new DependentVariableService()
      db.dependentVariable.remove = jest.fn(() => Promise.reject('error'))
      AppError.notFound = jest.fn()

      return target.deleteDependentVariable(1).then(() => {}, (err) => {
        expect(db.dependentVariable.remove).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteDependentVariablesForExperimentId', () => {
    it('calls removeByExperimentId', () => {
      const target = new DependentVariableService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.resolve())
      db.dependentVariable.removeByExperimentId = jest.fn(() => Promise.resolve())

      return target.deleteDependentVariablesForExperimentId(1, testTx).then(() => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.dependentVariable.removeByExperimentId).toHaveBeenCalledWith(testTx, 1)
      })
    })

    it('rejects when getExperimentById fails', () => {
      const target = new DependentVariableService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.reject())
      db.dependentVariable.removeByExperimentId = jest.fn()

      return target.deleteDependentVariablesForExperimentId(1, testTx).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.dependentVariable.removeByExperimentId).not.toHaveBeenCalled()
      })
    })
  })
})