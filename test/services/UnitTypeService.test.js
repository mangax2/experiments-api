import { mockReject, mockResolve } from '../jestUtil'
import UnitTypeService from '../../src/services/UnitTypeService'
import { dbRead } from '../../src/db/DbManager'

describe('UnitTypeService', () => {
  let target

  beforeEach(() => {
    target = new UnitTypeService()
  })
  describe('getAllUnitTypes', () => {
    test('gets unit types', () => {
      dbRead.unitType.all = mockResolve([{}])

      return target.getAllUnitTypes().then((data) => {
        expect(dbRead.unitType.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when find all fails', () => {
      const error = { message: 'error' }
      dbRead.unitType.all = mockReject(error)

      return target.getAllUnitTypes().then(() => {}, (err) => {
        expect(dbRead.unitType.all).toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
