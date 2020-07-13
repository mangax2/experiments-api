import AppError from './AppError'
import HttpUtil from './HttpUtil'
import VaultUtil from './VaultUtil'
import apiUrls from '../../config/apiUrls'

const oauthPing = require('@monsantoit/oauth-ping')

class PingUtil {
  static getMonsantoHeader() {
    const params = {
      clientId: VaultUtil.clientId,
      clientSecret: VaultUtil.clientSecret,
      url: `${apiUrls.pingUrl}/token.oauth2`,
    }
    const startTime = new Date().getTime()
    return oauthPing.httpGetToken(params)().then((token) => {
      HttpUtil.logExternalTime(startTime, 10000, 'oauth-ping', 'GET')
      return [
        { headerName: 'authorization', headerValue: `Bearer ${token}` },
        { headerName: 'Content-Type', headerValue: 'application/json' },
      ]
    }).catch((error) => {
      console.error('Authentication service returned error', error)
      return Promise.reject(AppError.create(500, 'Internal Server Error', 'Authentication service returned an error'))
    })
  }
}

module.exports = PingUtil
