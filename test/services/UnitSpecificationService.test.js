import { mock, mockReject, mockResolve } from '../jestUtil'
import UnitSpecificationService from '../../src/services/UnitSpecificationService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('UnitSpecificationService', () => {
  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new UnitSpecificationService()
  })

  describe('getUnitSpecificationById', () => {
    test('returns a unit specification', () => {
      db.unitSpecification.find = mockResolve({})

      return target.getUnitSpecificationById(1).then((data) => {
        expect(db.unitSpecification.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    test('throws an error when find returns empty', () => {
      db.unitSpecification.find = mockResolve()
      AppError.notFound = mock()

      return target.getUnitSpecificationById(1, { requestId: 5 }).then(() => {}, () => {
        expect(db.unitSpecification.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Unit Specification Not Found for requested id', undefined, '1T1001')
      })
    })

    test('rejects when find fails', () => {
      const error = { message: 'error' }
      db.unitSpecification.find = mockReject(error)

      return target.getUnitSpecificationById(1).then(() => {}, (err) => {
        expect(db.unitSpecification.find).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllUnitSpecifications', () => {
    test('gets all unit specifications', () => {
      db.unitSpecification.all = mockResolve([{}])

      return target.getAllUnitSpecifications().then((data) => {
        expect(db.unitSpecification.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when find all fails', () => {
      const error = { message: 'error' }
      db.unitSpecification.all = mockReject(error)

      return target.getAllUnitSpecifications().then(() => {}, (err) => {
        expect(db.unitSpecification.all).toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
