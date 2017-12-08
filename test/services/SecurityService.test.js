import { mock, mockReject, mockResolve } from '../jestUtil'
import SecurityService from '../../src/services/SecurityService'
import AppError from '../../src/services/utility/AppError'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'
import db from '../../src/db/DbManager'

describe('SecurityService', () => {
  let target
  const testTx = { tx: {} }
  const testContext = { userId: 'AK' }

  beforeEach(() => {
    target = new SecurityService()
  })

  describe('getGroupsByUserId', () => {
    test('returns empty Array profile api returns empty groups', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: {} })
      return target.getGroupsByUserId('kprat1').then((data) => {
        expect(PingUtil.getMonsantoHeader).toBeCalled()
        expect(HttpUtil.get).toBeCalled()
        expect(data.length).toBe(0)
        HttpUtil.get.mockReset()
        HttpUtil.get.mockClear()
      })
    })
    test('Calls The PingUtil and returns groupIds', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: { groups: [{ id: 'group1' }, { id: 'group2' }] } })
      return target.getGroupsByUserId('kprat1').then((response) => {
        expect(PingUtil.getMonsantoHeader).toBeCalled()
        expect(HttpUtil.get).toBeCalled()
        expect(response.length).toBe(2)
        HttpUtil.get.mockReset()
        HttpUtil.get.mockClear()
      })
    })
  })

  describe('getUserPermissionsForExperiment', () => {
    test('returns user permissions array ignoringCase', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['ak'],
      })
      target.getGroupsByUserId = jest.fn(() => ['group_1', 'group_2'])
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1, { userId: 'AK' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    test('returns user permissions array , when user is part of the group', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['ak'],
        group_ids: ['group_1'],
      })
      target.getGroupsByUserId = jest.fn(() => ['group_1', 'group_2'])
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1, { userId: 'KPRAT1' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    test('returns error when owner service fails', () => {
      target.ownerService.getOwnersByExperimentId = mockReject({
        error: 'error',
      })
      target.getGroupsByUserId = jest.fn(() => ['group_1', 'group_2'])

      return target.getUserPermissionsForExperiment(1, { userId: 'KPRAT1' }).catch((data) => {
        expect(data).toEqual({ error: 'error' })
      })
    })

    test('returns error when getGroupsByUserIdfails', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['ak'],
        group_ids: ['group_1'],
      })
      target.getGroupsByUserId = mockReject({
        error: 'error',
      })

      return target.getUserPermissionsForExperiment(1, { userId: 'KPRAT1' }).catch((data) => {
        expect(data).toEqual({ error: 'error' })
      })
    })


    test('returns user permissions array when more than one owner exists', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['AK', 'ky'],
      })
      target.getGroupsByUserId = jest.fn(() => ['group_1', 'group_2'])
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1, { userId: 'AK' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    test('returns empty permissions array when user not matched', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['AK'],
      })
      target.getGroupsByUserId = jest.fn(() => ['group_1', 'group_2'])
      const expectedResult = []

      return target.getUserPermissionsForExperiment(1, { userId: 'JN' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    test('returns empty permissions array when db query returns null', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve(null)
      const expectedResult = []
      target.getGroupsByUserId = jest.fn(() => ['group_1', 'group_2'])
      return target.getUserPermissionsForExperiment(1, { userId: 'JN' }).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })
  })

  describe('permissionsCheck', () => {
    test('calls getUserPermissionsForExperiment and returns resolved promise when user has access', () => {
      target.getUserPermissionsForExperiment = mockResolve(['write'])
      db.experiments.find = mockResolve({})
      return target.permissionsCheck(1, testContext, false, testTx).then(() => {
        expect(target.getUserPermissionsForExperiment).toHaveBeenCalledWith(1, testContext, testTx)
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
      })
    })

    test('calls getUserPermissionsForExperiment and throws error when user does not have access', () => {
      target.getUserPermissionsForExperiment = mockResolve([])
      db.experiments.find = mockResolve({})
      AppError.unauthorized = mock('')
      return target.permissionsCheck(1, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.getUserPermissionsForExperiment).toHaveBeenCalledWith(1, testContext, testTx)
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(err).toBe('')
      })
    })


    test('Does not call getUserPermissionsForExperiment and throws error when we are trying check' +
      ' for an invalid experimentId', () => {
      target.getUserPermissionsForExperiment = mockResolve([])
      db.experiments.find = mockResolve(undefined)
      AppError.notFound = mock()
      AppError.unauthorized = mock('')
      return target.permissionsCheck(1, testContext, false, testTx).then(() => {}, () => {
        expect(target.getUserPermissionsForExperiment).not.toHaveBeenCalled()
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested' +
          ' experimentId')
      })
    })

    test('Does not call getUserPermissionsForExperiment and throws error when we are trying check' +
      ' for an invalid TemplateId', () => {
      target.getUserPermissionsForExperiment = mockResolve([])
      db.experiments.find = mockResolve(undefined)
      AppError.notFound = mock()
      AppError.unauthorized = mock('')
      return target.permissionsCheck(1, testContext, true, testTx).then(() => {}, () => {
        expect(target.getUserPermissionsForExperiment).not.toHaveBeenCalled()
        expect(db.experiments.find).toHaveBeenCalledWith(1, true, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found for requested' +
          ' templateId')
      })
    })

    test('throws an error when userId is not set', () => {
      AppError.badRequest = mock('')
      db.experiments.find = mock()

      expect(() => target.permissionsCheck(1, {}, true, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
      expect(db.experiments.find).not.toHaveBeenCalled()
    })
  })

  describe('permissionsCheckForExperiments', () => {
    test('calls permissionsCheck for each experiment', () => {
      target.permissionsCheck = mockResolve()
      db.experiments.find = mockResolve({})
      return target.permissionsCheckForExperiments([1, 2], testContext, testTx).then(() => {
        expect(target.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.permissionsCheck).toHaveBeenLastCalledWith(2, testContext, testTx)
        expect(target.permissionsCheck).toHaveBeenCalledTimes(2)
      })
    })
  })
})
