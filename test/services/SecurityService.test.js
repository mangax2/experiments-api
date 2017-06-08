import { mock, mockReject, mockResolve } from '../jestUtil'
import SecurityService from '../../src/services/SecurityService'
import AppError from '../../src/services/utility/AppError'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'

describe('SecurityService', () => {
  let target
  const testTx = { tx: {} }
  const testContext = { userId: 'AK' }

  beforeEach(() => {
    target = new SecurityService()
  })

  describe('getGroupsByUserId', () => {
    it('returns empty Array profile api returns empty groups', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: {} })
     return target.getGroupsByUserId('kprat1').then((data) => {
        expect(PingUtil.getMonsantoHeader).toBeCalled()
        expect(HttpUtil.get).toBeCalled()
        expect(data.length).toBe(0)
      })
      HttpUtil.get.mockReset()
      HttpUtil.get.mockClear()
    })
    it('Calls The PingUtil and returns groupIds', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: { groups: [{ id: 'group1' }, { id: 'group2' }] } })
      return target.getGroupsByUserId('kprat1')
      expect(PingUtil.getMonsantoHeader).toBeCalled()
      expect(HttpUtil.get).toBeCalled()
      expect(response.length).toBe(2)
      HttpUtil.get.mockReset()
      HttpUtil.get.mockClear()
    })

  })

  describe('getUserPermissionsForExperiment', () => {
    it('returns user permissions array ignoringCase', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['ak'],
      })
      target.getGroupsByUserId = jest.fn(()=>{
        return ['group_1','group_2']
      })
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1, { userId: 'AK' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns user permissions array , when user is part of the group', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['ak'],
        group_ids:['group_1']
      })
      target.getGroupsByUserId = jest.fn(()=>{
        return ['group_1','group_2']
      })
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1, { userId: 'KPRAT1' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns error when owner service fails', () => {
      target.ownerService.getOwnersByExperimentId = mockReject({
       error:'error'
      })
      target.getGroupsByUserId = jest.fn(()=>{
        return ['group_1','group_2']
      })

      return target.getUserPermissionsForExperiment(1, { userId: 'KPRAT1' }).catch((data) => {
        expect(data).toEqual({"error": "error"})
      })
    })

    it('returns error when getGroupsByUserIdfails', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['ak'],
        group_ids:['group_1']
      })
      target.getGroupsByUserId= mockReject({
        error:'error'
      })

      return target.getUserPermissionsForExperiment(1, { userId: 'KPRAT1' }).catch((data) => {
        expect(data).toEqual({"error": "error"})
      })
    })


    it('returns user permissions array when more than one owner exists', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['AK', 'ky'],
      })
      target.getGroupsByUserId = jest.fn(()=>{
        return ['group_1','group_2']
      })
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1, { userId: 'AK' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns empty permissions array when user not matched', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['AK'],
      })
      target.getGroupsByUserId = jest.fn(()=>{
        return ['group_1','group_2']
      })
      const expectedResult = []

      return target.getUserPermissionsForExperiment(1, { userId: 'JN' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns empty permissions array when db query returns null', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve(null)
      const expectedResult = []
      target.getGroupsByUserId = jest.fn(()=>{
        return ['group_1','group_2']
      })
      return target.getUserPermissionsForExperiment(1, { userId: 'JN' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

  })

  describe('permissionsCheck', () => {
    it('calls getUserPermissionsForExperiment and returns resolved promise when user has access', () => {
      target.getUserPermissionsForExperiment = mockResolve(['write'])
      return target.permissionsCheck(1, testContext, testTx).then(() => {
        expect(target.getUserPermissionsForExperiment).toHaveBeenCalledWith(1, testContext, testTx)
      })
    })

    it('calls getUserPermissionsForExperiment and throws error when user does not have access', () => {
      target.getUserPermissionsForExperiment = mockResolve([])
      AppError.unauthorized = mock('')
      return target.permissionsCheck(1, testContext, testTx).then(() => {}, (err) => {
        expect(target.getUserPermissionsForExperiment).toHaveBeenCalledWith(1, testContext, testTx)
        expect(err).toBe('')
      })
    })

  })

  describe('permissionsCheckForExperiments', () => {
    it('calls permissionsCheck for each experiment', () => {
      target.permissionsCheck = mockResolve()
      return target.permissionsCheckForExperiments([1, 2], testContext, testTx).then(() => {
        expect(target.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.permissionsCheck).toHaveBeenLastCalledWith(2, testContext, testTx)
        expect(target.permissionsCheck).toHaveBeenCalledTimes(2)

      })
    })

  })

})