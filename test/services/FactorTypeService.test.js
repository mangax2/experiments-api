import { mock, mockReject, mockResolve } from '../jestUtil'
import FactorTypeService from '../../src/services/FactorTypeService'
import db from '../../src/db/DbManager'

describe('factorTypeService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.factorType.repository = mock({ tx(transactionName, callback) { return callback(testTx) } })

  beforeEach(() => {
    expect.hasAssertions()
    target = new FactorTypeService()
  })

  describe('createFactorType', () => {
    test('validates and factorType create', () => {
      target.validator.validate = mockResolve()
      db.factorType.create = mockResolve({})

      return target.createFactorType({}, testContext).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.create).toHaveBeenCalledWith(testTx, {}, testContext)
        expect(data).toEqual({})
      })
    })

    test('rejects when factorType create fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.factorType.create = mockReject(error)

      return target.createFactorType({}, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.create).toHaveBeenCalledWith(testTx, {}, testContext)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.factorType.create = mockReject(error)

      return target.createFactorType({}, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}])
        expect(db.factorType.create).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllFactorTypes', () => {
    test('returns factorTypes', () => {
      db.factorType.all = mockResolve([{}])

      return target.getAllFactorTypes().then((data) => {
        expect(db.factorType.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when get all fails', () => {
      const error = { message: 'error' }
      db.factorType.all = mockReject(error)

      return target.getAllFactorTypes().then(() => {}, (err) => {
        expect(db.factorType.all).toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
