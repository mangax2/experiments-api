import log4js from 'log4js'
import AppError from './AppError'
import HttpUtil from './HttpUtil'

const oauthPing = require('@monsantoit/oauth-ping')
const cfServices = require('./ServiceConfig')

const logger = log4js.getLogger('PingUtil')

class PingUtil {
  static getMonsantoHeader() {
    const params = {
      clientId: cfServices.pingDataSource.clientId,
      clientSecret: cfServices.pingDataSource.clientSecret,
      url: cfServices.pingDataSource.url,
    }
    const startTime = new Date().getTime()
    return oauthPing.httpGetToken(params).then((token) => {
      HttpUtil.logExternalTime(startTime, 10000, 'oauth-ping', 'GET')
      return [
        { headerName: 'authorization', headerValue: `Bearer ${token}` },
        { headerName: 'Content-Type', headerValue: 'application/json' },
      ]
    }).catch((error) => {
      logger.error('Authentication service returned error', error)
      return Promise.reject(AppError.create(500, 'Internal Server Error', 'Authentication service' +
        ' returned' +
        ' error'))
    })
  }
}

module.exports = PingUtil
