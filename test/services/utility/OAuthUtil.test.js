import oauth from '@monsantoit/oauth-azure'
import { mockResolve } from '../../jestUtil'
import OAuthUtil from '../../../src/services/utility/OAuthUtil'
import configurator from '../../../src/configs/configurator'

jest.mock('@monsantoit/oauth-azure')

describe('OAuthUtil', () => {
  configurator.get = path => path.split('.').pop()

  describe('getAuthorizationHeaders', () => {
    beforeEach(() => {
      oauth.httpGetToken.mockRestore()
    })

    test('calls oauth and returns headers', async () => {
      const getToken = mockResolve('token')
      oauth.httpGetToken = jest.fn().mockReturnValue(getToken)

      const result = await OAuthUtil.getAuthorizationHeaders()

      expect(result).toEqual([
        { headerName: 'authorization', headerValue: 'Bearer token' },
        { headerName: 'Content-Type', headerValue: 'application/json' },
      ])
    })

    test('calls agentPost.send with params', async () => {
      const getToken = mockResolve('token')
      oauth.httpGetToken = jest.fn().mockReturnValue(getToken)

      await OAuthUtil.getAuthorizationHeaders()

      expect(oauth.httpGetToken).toHaveBeenCalledWith({
        clientId: 'clientId',
        clientSecret: 'clientSecret',
        url: 'oauthUrl',
      })
    })
  })
})
