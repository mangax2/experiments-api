import { mock, mockResolve, mockReject } from '../jestUtil'
import PingUtil from '../../src/services/utility/PingUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PreferencesService from '../../src/services/PreferencesService'
import AppError from '../../src/services/utility/AppError'

describe('PreferencesService', () => {
  describe('handlePreferencesAPIError', () => {
    test('returns a bad request when status is 400', () => {
      AppError.badRequest = mock('')
      const target = new PreferencesService()
      target.handlePreferencesAPIError({ status: 400 }, 1)
      expect(AppError.badRequest).toHaveBeenCalledWith('Bad Request', undefined, 1)
    })

    test('returns unauthorized when status is 401', () => {
      AppError.unauthorized = mock('')
      const target = new PreferencesService()
      target.handlePreferencesAPIError({ status: 401, response: { text: 'Unauthorized' } }, 1)
      expect(AppError.unauthorized).toHaveBeenCalledWith('Unauthorized', undefined, 1)
    })

    test('returns forbidden when status is 403', () => {
      AppError.forbidden = mock('')
      const target = new PreferencesService()
      target.handlePreferencesAPIError({ status: 403, response: { text: 'Forbidden' } }, 1)
      expect(AppError.forbidden).toHaveBeenCalledWith('Forbidden', undefined, 1)
    })

    test('returns not found when status is 404', () => {
      AppError.badRequest = mock('')
      const target = new PreferencesService()
      target.handlePreferencesAPIError({ status: 404, response: { text: 'Forbidden' } }, 1)
      expect(AppError.badRequest).toHaveBeenCalledWith('Preferences not found', undefined, 1)
    })

    test('returns 500 for other errors', () => {
      const target = new PreferencesService()
      expect(target.handlePreferencesAPIError({ status: 502, response: { text: 'It Broke' } }, 1))
        .toEqual({
          status: 500, code: 'Internal Server Error', message: 'Error received from Preferences API: It Broke', errorCode: 1,
        })
    })
  })

  describe('getPreferences', () => {
    test('successfully gets preferences', () => {
      PingUtil.getMonsantoHeader = mockResolve([{ headerName: 'authorization', headerValue: 'testAuth' }])
      HttpUtil.get = mockResolve()
      const target = new PreferencesService()

      return target.getPreferences('ns', 'sns', 'userAuth', {}).then(() => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.get).toHaveBeenCalledWith('https://preferences.velocity-np.ag/v2/user/ns/sns', [{ headerName: 'authorization', headerValue: 'userAuth' }])
      })
    })

    test('throws an error when it fails to retrieve preferences', () => {
      PingUtil.getMonsantoHeader = mockResolve([{ headerName: 'authorization', headerValue: 'testAuth' }])
      HttpUtil.get = mockReject()
      const target = new PreferencesService()
      target.handlePreferencesAPIError = mock()

      return target.getPreferences('ns', 'sns', 'userAuth', { requestId: 1 }).then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.get).toHaveBeenCalledWith('https://preferences.velocity-np.ag/v2/user/ns/sns', [{ headerName: 'authorization', headerValue: 'userAuth' }])
        expect(target.handlePreferencesAPIError).toHaveBeenCalledWith(undefined, '1X2001')
      })
    })
  })

  describe('setPreferences', () => {
    test('successfully sets preferences', () => {
      PingUtil.getMonsantoHeader = mockResolve([{ headerName: 'authorization', headerValue: 'testAuth' }])
      HttpUtil.put = mockResolve()
      const target = new PreferencesService()

      return target.setPreferences('ns', 'sns', {}, 'userAuth', {}).then(() => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.put).toHaveBeenCalledWith('https://preferences.velocity-np.ag/v2/user/ns/sns', [{ headerName: 'authorization', headerValue: 'userAuth' }], {})
      })
    })

    test('throws an error when it fails to set preferences', () => {
      PingUtil.getMonsantoHeader = mockResolve([{ headerName: 'authorization', headerValue: 'testAuth' }])
      HttpUtil.put = mockReject()
      const target = new PreferencesService()
      target.handlePreferencesAPIError = mock()

      return target.setPreferences('ns', 'sns', {}, 'userAuth', { requestId: 1 }).then(() => {}, () => {
        expect(PingUtil.getMonsantoHeader).toHaveBeenCalled()
        expect(HttpUtil.put).toHaveBeenCalledWith('https://preferences.velocity-np.ag/v2/user/ns/sns', [{ headerName: 'authorization', headerValue: 'userAuth' }], {})
        expect(target.handlePreferencesAPIError).toHaveBeenCalledWith(undefined, '1X3001')
      })
    })
  })
})
