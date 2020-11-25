import { mock, mockReject, mockResolve } from '../jestUtil'
import AppError from '../../src/services/utility/AppError'
import OAuthUtil from '../../src/services/utility/OAuthUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'
import ListsService from '../../src/services/ListsService'

describe('ListsService', () => {
  describe('getLists', () => {
    test('gets authorization headers and calls lists api', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve([])
      HttpUtil.get = mockResolve([])

      const target = new ListsService()
      return target.getLists('KMCCL', [1, 2]).then(() => {
        expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
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
      target.getLists = mockResolve({ body: { content: [{ id: 2 }, { id: 3 }] } })

      return target.setUserLists('kmccl', [1], { authorization: '' }, {}).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Not all provided list ids are valid. Invalid List Ids: 1', null, '1W2002')
      })
    })

    test('throws an error when Material Lists call fails', () => {
      AppError.internalServerError = mock('')

      const target = new ListsService()
      target.getLists = mockReject({ response: { text: '{ "message": "It Broke"}' } })

      return target.setUserLists('kmccl', ['a'], { authorization: '' }, {}).then(() => {}, () => {
        expect(AppError.internalServerError).toHaveBeenCalledWith('Error Retrieving Lists', { message: 'It Broke' }, '1W2003')
      })
    })

    test('adds the provided list ids to the user preferences', () => {
      const target = new ListsService({ getPreferences: mockResolve({ body: {} }), setPreferences: mockResolve() })
      target.getLists = mockResolve({ body: { content: [{ id: 1 }, { id: 2 }] } })

      return target.setUserLists('kmccl', [1, 2], { authorization: '' }, {}).then(() => {
        expect(target.getLists).toHaveBeenCalledWith('kmccl', [1, 2])
        expect(target.preferencesService.getPreferences).toHaveBeenCalledWith('material-lists-integration', 'experiments-ui', '', {})
        expect(target.preferencesService.setPreferences).toHaveBeenCalledWith('material-lists-integration', 'experiments-ui', { listIds: [1, 2] }, '', {})
      })
    })
  })
})
