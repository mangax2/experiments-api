import { mockResolve } from '../jestUtil'
import RefDesignSpecificationService from '../../src/services/RefDesignSpecificationService'
import db from '../../src/db/DbManager'

describe('RefDesignSpecificationService', () => {
  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new RefDesignSpecificationService()
  })

  describe('getAllRefDesignSpecs', () => {
    test('getAllRefDesignSpecs', () => {
      db.refDesignSpecification.all = mockResolve({})

      return target.getAllRefDesignSpecs().then(() => {
        expect(db.refDesignSpecification.all).toHaveBeenCalled()
      })
    })
  })
})
