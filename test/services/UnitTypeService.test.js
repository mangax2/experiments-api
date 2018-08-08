import { mock, mockReject, mockResolve } from '../jestUtil'
import UnitTypeService from '../../src/services/UnitTypeService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'

describe('UnitTypeService', () => {
  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new UnitTypeService()
  })

  describe('getUnitTypeById', () => {
    test('gets a unitType', () => {
      db.unitType.find = mockResolve({})

      return target.getUnitTypeById(1).then((data) => {
        expect(db.unitType.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    test('throws an error when nothing is returned', () => {
      db.unitType.find = mockResolve()
      AppError.notFound = mock()

      return target.getUnitTypeById(1, { requestId: 5 }).then(() => {}, () => {
        expect(db.unitType.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Unit Type Not Found for requested id', undefined, '1U1001')
      })
    })

    test('rejects when find fails', () => {
      const error = { message: 'error' }
      db.unitType.find = mockReject(error)

      return target.getUnitTypeById(1).then(() => {}, (err) => {
        expect(db.unitType.find).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllUnitTypes', () => {
    test('gets unit types', () => {
      db.unitType.all = mockResolve([{}])

      return target.getAllUnitTypes().then((data) => {
        expect(db.unitType.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when find all fails', () => {
      const error = { message: 'error' }
      db.unitType.all = mockReject(error)

      return target.getAllUnitTypes().then(() => {}, (err) => {
        expect(db.unitType.all).toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
