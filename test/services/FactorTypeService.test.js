import { mock, mockReject, mockResolve } from '../jestUtil'
import FactorTypeService from '../../src/services/FactorTypeService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'

describe('factorTypeService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.factorType.repository = mock({ tx: function (transactionName, callback) {return callback(testTx)} })

  beforeEach(() => {
    target = new FactorTypeService()
  })

  describe('createFactorType', () => {
    it('validates and factorType create', () => {
      target.validator.validate = mockResolve()
      db.factorType.create = mockResolve({})

      return target.createFactorType({}, testContext).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.create).toHaveBeenCalledWith(testTx, {}, testContext)
        expect(data).toEqual({})
      })
    })

    it('rejects when factorType create fails', () => {
      target.validator.validate = mockResolve()
      db.factorType.create = mockReject('error')

      return target.createFactorType({}, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.create).toHaveBeenCalledWith(testTx, {}, testContext)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.factorType.create = mockReject('error')

      return target.createFactorType({}, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.create).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getAllFactorTypes', () => {
    it('returns factorTypes', () => {
      db.factorType.all = mockResolve([{}])

      return target.getAllFactorTypes().then((data) => {
        expect(db.factorType.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    it('rejects when get all fails', () => {
      db.factorType.all = mockReject('error')

      return target.getAllFactorTypes().then(() => {}, (err) => {
        expect(db.factorType.all).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getFactorTypeById', () => {
    it('returns a factor type', () => {
      db.factorType.find = mockResolve({})

      return target.getFactorTypeById(1).then((data) => {
        expect(db.factorType.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when returned data is empty', () => {
      db.factorType.find = mockResolve()
      AppError.notFound = mock()

      return target.getFactorTypeById(1).then(() => {}, () => {
        expect(db.factorType.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Factor Type Not Found')
      })
    })

    it('rejects when find fails', () => {
      db.factorType.find = mockReject('error')

      return target.getFactorTypeById(1).then(() => {}, (err) => {
        expect(db.factorType.find).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('updateFactorType', () => {
    it('updates a factorType', () => {
      target.validator.validate = mockResolve()
      db.factorType.update = mockResolve({})

      return target.updateFactorType(1, {}, testContext).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.update).toHaveBeenCalledWith(testTx, 1, {}, testContext)
        expect(data).toEqual({})
      })
    })

    it('throws an error when update returns no data', () => {
      target.validator.validate = mockResolve()
      db.factorType.update = mockResolve()
      AppError.notFound = mock()

      return target.updateFactorType(1, {}, testContext).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.update).toHaveBeenCalledWith(testTx, 1, {}, testContext)
        expect(AppError.notFound).toHaveBeenCalledWith('Factor Type Not Found')
      })
    })

    it('rejects when update fails', () => {
      target.validator.validate = mockResolve()
      db.factorType.update = mockReject('error')

      return target.updateFactorType(1, {}, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.update).toHaveBeenCalledWith(testTx, 1, {}, testContext)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.factorType.update = mockReject()

      return target.updateFactorType(1, {}, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.update).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteFactorType', () => {
    it('deletes a factor type', () => {
      db.factorType.delete = mockResolve(1)

      return target.deleteFactorType(1).then((data) => {
        expect(db.factorType.delete).toHaveBeenCalledWith(testTx, 1)
        expect(data).toEqual(1)
      })
    })

    it('throws an error when delete returns empty', () => {
      db.factorType.delete = mockResolve()
      AppError.notFound = mock()

      return target.deleteFactorType(1).then(() => {}, () => {
        expect(db.factorType.delete).toHaveBeenCalledWith(testTx, 1)
        expect(AppError.notFound).toHaveBeenCalledWith('Factor Type Not Found')
      })
    })

    it('rejects when delete fails', () => {
      db.factorType.delete = mockReject('error')

      return target.deleteFactorType(1).then(() => {}, (err) => {
        expect(db.factorType.delete).toHaveBeenCalledWith(testTx, 1)
        expect(err).toEqual('error')
      })
    })
  })
})