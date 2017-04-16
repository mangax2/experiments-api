import ExperimentDesignService from '../../src/services/ExperimentDesignService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('ExperimentDesignService', () => {
  const testContext = {}
  const testTx = {tx: {}}

  const transactionMock = db.experimentDesign.repository = jest.fn(() => {
    return { tx: function (transactionName, callback) {return callback(testTx)} }
  })

  describe('createExperimentDesign', () => {
    it('calls validate and create', () => {
      const target = new ExperimentDesignService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experimentDesign.create = jest.fn(() => Promise.resolve(1))

      return target.createExperimentDesign({}, testContext).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.create).toHaveBeenCalledWith(testTx, {}, testContext)
        expect(data).toEqual(1)
      })
    })

    it('rejects when validate fails' , () => {
      const target = new ExperimentDesignService()
      target.validator.validate = jest.fn(() => Promise.reject())
      db.experimentDesign.create = jest.fn()

      return target.createExperimentDesign({}, testContext).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.create).not.toHaveBeenCalled()
      })
    })
  })

  describe('getAllExperimentDesigns', () => {
    it('calls experimentDesign all' , () => {
      const target = new ExperimentDesignService()
      db.experimentDesign.all = jest.fn(() => Promise.resolve([]))

      return target.getAllExperimentDesigns().then((data) => {
        expect(db.experimentDesign.all).toHaveBeenCalled()
        expect(data).toEqual([])
      })
    })
  })

  describe('getExperimentDesignById', () => {
    it('returns data from experimentDesign find', () => {
      const target = new ExperimentDesignService()
      db.experimentDesign.find = jest.fn(() => Promise.resolve({}))

      return target.getExperimentDesignById(1).then((data) => {
        expect(db.experimentDesign.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when data returned is undefined', () => {
      const target = new ExperimentDesignService()
      db.experimentDesign.find = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

      return target.getExperimentDesignById(1).then(() => {}, () => {
        expect(db.experimentDesign.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Design Not Found')
      })
    })
  })

  describe('updateExperimentDesign', () => {
    it('calls validate and update successfully', () => {
      const target = new ExperimentDesignService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experimentDesign.update = jest.fn(() => Promise.resolve({}))

      return target.updateExperimentDesign(1, {}, testContext).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.update).toHaveBeenCalledWith(1, {}, testContext)
        expect(data).toEqual({})
      })
    })

    it('throws an error when update returns no data', () => {
      const target = new ExperimentDesignService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experimentDesign.update = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

      return target.updateExperimentDesign(1, {}, testContext).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.update).toHaveBeenCalledWith(1, {}, testContext)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Design Not Found')
      })
    })

    it('rejects when update fails' , () => {
      const target = new ExperimentDesignService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experimentDesign.update = jest.fn(() => Promise.reject())
      AppError.notFound = jest.fn()

      return target.updateExperimentDesign(1, {}, testContext).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.update).toHaveBeenCalledWith(1, {}, testContext)
        expect(AppError.notFound).not.toHaveBeenCalledWith()
      })
    })

    it('rejects when validate fails' , () => {
      const target = new ExperimentDesignService()
      target.validator.validate = jest.fn(() => Promise.reject())
      db.experimentDesign.update = jest.fn()
      AppError.notFound = jest.fn()

      return target.updateExperimentDesign(1, {}, testContext).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.experimentDesign.update).not.toHaveBeenCalled()
        expect(AppError.notFound).not.toHaveBeenCalledWith()
      })
    })
  })

  describe('deleteExperimentDesign', () => {
    it('calls delete successfully' ,() => {
      const target = new ExperimentDesignService()
      db.experimentDesign.delete = jest.fn(() => Promise.resolve({}))

      return target.deleteExperimentDesign(1).then((data) => {
        expect(db.experimentDesign.delete).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws notFound when data returned is null' , () => {
      const target = new ExperimentDesignService()
      db.experimentDesign.delete = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

      return target.deleteExperimentDesign(1).then(() => {}, () => {
        expect(db.experimentDesign.delete).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Design Not Found')
      })
    })
  })
})