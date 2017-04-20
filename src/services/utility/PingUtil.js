const oauthPing = require('@monsantoit/oauth-ping')
const cfServices = require('./ServiceConfig')

class PingUtil {
  static getMonsantoHeader() {
    const params = {
      clientId: cfServices.pingDataSource.clientId,
      clientSecret: cfServices.pingDataSource.clientSecret,
      url: cfServices.pingDataSource.url,
    }
    return oauthPing.httpGetToken(params).then(token => [
      { headerName: 'authorization', headerValue: `Bearer ${token}` },
      { headerName: 'Content-Type', headerValue: 'application/json' },
    ])
  }
}

module.exports = PingUtil
