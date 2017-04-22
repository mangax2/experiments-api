import { mock, mockReject, mockResolve } from '../jestUtil'
import UnitSpecificationService from '../../src/services/UnitSpecificationService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('UnitSpecificationService', () => {
  let target

  beforeEach(() => {
    target = new UnitSpecificationService()
  })

  describe('getUnitSpecificationById', () => {
    it('returns a unit specification', () => {
      db.unitSpecification.find = mockResolve({})

      return target.getUnitSpecificationById(1).then((data) => {
        expect(db.unitSpecification.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when find returns empty', () => {
      db.unitSpecification.find = mockResolve()
      AppError.notFound = mock()

      return target.getUnitSpecificationById(1).then(() => {}, () => {
        expect(db.unitSpecification.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Unit Specification Not Found for' +
          ' requested id')
      })
    })

    it('rejects when find fails', () => {
      db.unitSpecification.find = mockReject('error')

      return target.getUnitSpecificationById(1).then(() => {}, (err) => {
        expect(db.unitSpecification.find).toHaveBeenCalledWith(1)
        expect(err).toEqual('error')
      })
    })
  })

  describe('getAllUnitSpecifications', () => {
    it('gets all unit specifications', () => {
      db.unitSpecification.all = mockResolve([{}])

      return target.getAllUnitSpecifications().then((data) => {
        expect(db.unitSpecification.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    it('rejects when find all fails', () => {
      db.unitSpecification.all = mockReject('error')

      return target.getAllUnitSpecifications().then(() => {}, (err) => {
        expect(db.unitSpecification.all).toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})