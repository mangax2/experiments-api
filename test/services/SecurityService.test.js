import { mock, mockReject, mockResolve } from '../jestUtil'
import SecurityService from '../../src/services/SecurityService'
import AppError from '../../src/services/utility/AppError'

describe('SecurityService', () => {
  let target
  const testTx = { tx: {} }
  const testContext = { userId: 'AK' }

  beforeEach(() => {
    target = new SecurityService()
  })

  describe('getUserPermissionsForExperiment', () => {
    it('returns user permissions array ignoringCase', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['ak']
      })
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1, { userId: 'AK' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns user permissions array when more than one owner exists', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['AK', 'ky']
      })
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1, { userId: 'AK' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns empty permissions array when user not matched', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['AK']
      })
      const expectedResult = []

      return target.getUserPermissionsForExperiment(1, { userId: 'JN' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns empty permissions array when db query returns null', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve(null)
      const expectedResult = []

      return target.getUserPermissionsForExperiment(1, { userId: 'JN' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

  })


  describe('permissionsCheck', () => {
    it('calls getUserPermissionsForExperiment and returns resolved promise when user has access', () => {
      target.getUserPermissionsForExperiment = mockResolve(['write'])
      return target.permissionsCheck(1, testContext, testTx).then(() => {
        expect(target.getUserPermissionsForExperiment).toHaveBeenCalledWith(1,testContext, testTx)
      })
    })

    it('calls getUserPermissionsForExperiment and throws error when user does not have access', () => {
      target.getUserPermissionsForExperiment = mockResolve([])
      AppError.unauthorized = mock('')
      return target.permissionsCheck(1, testContext, testTx).then(() => {}, (err) => {
        expect(target.getUserPermissionsForExperiment).toHaveBeenCalledWith(1,testContext, testTx)
        expect(err).toBe('')
      })
    })

  })



  describe('permissionsCheckForExperiments', () => {
    it('calls permissionsCheck for each experiment', () => {
      target.permissionsCheck = mockResolve()
      return target.permissionsCheckForExperiments([1,2], testContext, testTx).then(() => {
        expect(target.permissionsCheck).toHaveBeenCalledWith(1,testContext, testTx)
        expect(target.permissionsCheck).toHaveBeenLastCalledWith(2,testContext, testTx)
        expect(target.permissionsCheck).toHaveBeenCalledTimes(2)

      })
    })


  })


})