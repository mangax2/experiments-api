import { mock, mockReject, mockResolve } from '../jestUtil'
import RefDesignSpecificationService from '../../src/services/RefDesignSpecificationService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'

describe('RefDesignSpecificationService', () => {
  let target

  beforeEach(() => {
    target = new RefDesignSpecificationService()
  })

  describe('getDesignSpecById', () => {

    it('getDesignSpecById returns data when refDesignSpec found', () => {
      db.refDesignSpecification.find = mockResolve({})

      return target.getDesignSpecById(1).then((data) => {
        expect(db.refDesignSpecification.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('getDesignSpecById returns error when entity not found', () => {
      db.refDesignSpecification.find = mockResolve()
      AppError.notFound = mock()

      return target.getDesignSpecById(1, { transactionId: 5 }).then(() => {}, () =>  {
        expect(db.refDesignSpecification.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('[[5]] RefDesignSpec Not Found for requested id')

      })
    })

  })


  describe('getAllRefDesignSpecs', () => {

    it('getAllRefDesignSpecs', () => {
      db.refDesignSpecification.all = mockResolve({})

      return target.getAllRefDesignSpecs().then((data) => {
        expect(db.refDesignSpecification.all).toHaveBeenCalled()
      })
    })

  })

})