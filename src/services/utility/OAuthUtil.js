import oauth from '@monsantoit/oauth-azure'
import AppError from './AppError'
import HttpUtil from './HttpUtil'
import configurator from '../../configs/configurator'

class OAuthUtil {
  static getAuthorizationHeaders = async () => {

    const params = {
      clientId: configurator.get('client.clientId'),
      clientSecret: configurator.get('client.clientSecret'),
      url: configurator.get('urls.oauthUrl'),
    }
    const startTime = new Date().getTime()

    try {
      const token = await oauth.httpGetToken(params)()
      HttpUtil.logExternalTime(startTime, 10000, 'oauth-azure-token', 'GET')
      return [
        { headerName: 'authorization', headerValue: `Bearer ${token}` },
        { headerName: 'Content-Type', headerValue: 'application/json' },
      ]
    } catch (err) {
      console.error('Authentication service returned an error', err.status, err.body)
      return Promise.reject(
        AppError.create(500, 'Internal Server Error', 'Authentication Service Returned An Error'),
      )
    }

  }
}

module.exports = OAuthUtil