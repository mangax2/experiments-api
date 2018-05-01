import { mock, mockResolve } from '../jestUtil'
import AppError from '../../src/services/utility/AppError'
import PingUtil from '../../src/services/utility/PingUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'
import ListsService from '../../src/services/ListsService'

describe('ListsService', () => {
  describe('getLists', () => {
    test('gets authorization headers and calls lists api', () => {
      PingUtil.getMonsantoHeader = mockResolve([])
      HttpUtil.get = mockResolve([])

      const target = new ListsService()
      return target.getLists('KMCCL', [1, 2]).then(() => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.get).toHaveBeenCalledWith('https://api01-np.agro.services/material-lists-api/v1/lists?id=1&id=2', [{ headerName: 'user-id', headerValue: 'kmccl' }])
      })
    })
  })

  describe('setUserLists', () => {
    test('throws an error when userId is undefined', () => {
      AppError.badRequest = mock('')

      const target = new ListsService()

      expect(() => target.setUserLists(undefined, [], [], {})).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('UserId and Authorization Header must be present', null, '1W2001')
    })

    test('throws an error when headers is undefined', () => {
      AppError.badRequest = mock('')

      const target = new ListsService()

      expect(() => target.setUserLists('kmccl', [], undefined, {})).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('UserId and Authorization Header must be present', null, '1W2001')
    })

    test('throws an error when authorization header is undefined', () => {
      AppError.badRequest = mock('')

      const target = new ListsService()

      expect(() => target.setUserLists('kmccl', {}, {}, {})).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('UserId and Authorization Header must be present', null, '1W2001')
    })

    test('throws an error when not all provided list ids are valid', () => {
      AppError.badRequest = mock('')

      const target = new ListsService()
      target.getLists = mockResolve({ body: { content: [{}, {}] } })

      return target.setUserLists('kmccl', [1], { authorization: '' }, {}).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Not all provided list ids are valid', null, '1W2002')
      })
    })

    test('adds the provided list ids to the user preferences', () => {
      const target = new ListsService({ getPreferences: mockResolve({ body: {} }), setPreferences: mockResolve() })
      target.getLists = mockResolve({ body: { content: [{}, {}] } })

      return target.setUserLists('kmccl', [1, 2], { authorization: '' }, {}).then(() => {
        expect(target.getLists).toHaveBeenCalledWith('kmccl', [1, 2])
        expect(target.preferencesService.getPreferences).toHaveBeenCalledWith('experiments-ui', 'factors', '', {})
        expect(target.preferencesService.setPreferences).toHaveBeenCalledWith('experiments-ui', 'factors', { listIds: [1, 2] }, '', {})
      })
    })
  })
})
