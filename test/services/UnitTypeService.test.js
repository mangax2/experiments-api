import { mockReject, mockResolve } from '../jestUtil'
import UnitTypeService from '../../src/services/UnitTypeService'
import db from '../../src/db/DbManager'


describe('UnitTypeService', () => {
  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new UnitTypeService()
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
