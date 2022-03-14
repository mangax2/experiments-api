import agent from 'superagent'
import AppError from './AppError'
import HttpUtil from './HttpUtil'
import configurator from '../../configs/configurator'

class OAuthUtil {
  static getAuthorizationHeaders() {
    const params = {
      client_id: configurator.get('client.clientId'),
      client_secret: configurator.get('client.clientSecret'),
      scope: `${configurator.get('client.clientId')}/.default`,
      grant_type: 'client_credentials',
    }
    const startTime = new Date().getTime()
    return agent.post(configurator.get('apiUrls.oauthUrl'))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(params)
      .then((result) => {
        HttpUtil.logExternalTime(startTime, 10000, 'oauth-azure-token', 'GET')
        return [
          { headerName: 'authorization', headerValue: `Bearer ${result.body.access_token}` },
          { headerName: 'Content-Type', headerValue: 'application/json' },
        ]
      })
      .catch((error) => {
        console.error('Authentication service returned an error', error.status, error.body)
        return Promise.reject(
          AppError.create(500, 'Internal Server Error', 'Authentication service returned an error'),
        )
      })
  }
}

module.exports = OAuthUtil
