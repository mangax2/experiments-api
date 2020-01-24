import { mockReject, mockResolve } from '../jestUtil'
import UnitSpecificationService from '../../src/services/UnitSpecificationService'
import db from '../../src/db/DbManager'

describe('UnitSpecificationService', () => {
  let target

  beforeEach(() => {
    target = new UnitSpecificationService()
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
