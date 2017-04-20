const log4js = require('log4js')
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
    logger.info(`client id: '${params.clientId}'`)
    logger.info(`client secret: '${params.clientSecret}'`)
    logger.info(`url: '${params.url}'`)
    return oauthPing.httpGetToken(params).then(token => [
      { headerName: 'authorization', headerValue: `Bearer ${token}` },
      { headerName: 'Content-Type', headerValue: 'application/json' },
    ])
  }
}

module.exports = PingUtil
