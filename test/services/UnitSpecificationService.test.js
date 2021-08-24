import { mockReject, mockResolve } from '../jestUtil'
import UnitSpecificationService from '../../src/services/UnitSpecificationService'
import { dbRead } from '../../src/db/DbManager'

describe('UnitSpecificationService', () => {
  let target

  beforeEach(() => {
    target = new UnitSpecificationService()
  })

  describe('getAllUnitSpecifications', () => {
    test('gets all unit specifications', () => {
      dbRead.unitSpecification.all = mockResolve([{}])

      return target.getAllUnitSpecifications().then((data) => {
        expect(dbRead.unitSpecification.all).toHaveBeenCalled()
        expect(data).toEqual([{}])
      })
    })

    test('rejects when find all fails', () => {
      const error = { message: 'error' }
      dbRead.unitSpecification.all = mockReject(error)

      return target.getAllUnitSpecifications().then(() => {}, (err) => {
        expect(dbRead.unitSpecification.all).toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})
