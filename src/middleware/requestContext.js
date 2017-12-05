import _ from 'lodash'
import uuid from 'uuid/v4'
import AppError from '../services/utility/AppError'

function requestContextMiddlewareFunction(req, res, next) {
  const whitelistedUrls = ['/experiments-api/api-docs', '/metrics', '/experiments-api/ping', '/ping', '/experiments-api/docs/']
  const whitelistedExtensions = ['.png', '.jpg', '.md', '.js', '.css']

  req.context = {
    requestId: (req.headers ? req.headers['X-Request-Id'] : null) || uuid(),
  }
  res.set('X-Request-Id', req.context.requestId)

  if (whitelistedUrls.includes(req.url)
    || (req.url && _.filter(whitelistedExtensions, ext => req.url.endsWith(ext)).length > 0)
    || (req.method === 'GET')) {
    next()
  } else {
    if (!req.headers) {
      throw AppError.badRequest('oauth_resourceownerinfo headers is null.')
    }
    const header = req.headers.oauth_resourceownerinfo
    if (!header) {
      throw AppError.badRequest('oauth_resourceownerinfo header not found.')
    }
    const tokens = header.split(',')
    const userIdToken = _.find(tokens, token => token.startsWith('username'))
    if (!userIdToken) {
      throw AppError.badRequest('username not found within oauth_resourceownerinfo.')
    }
    const userIdTokens = userIdToken.split('=')
    if (userIdTokens.length !== 2) {
      throw AppError.badRequest('username within oauth_resourceownerinfo does not represent key=value pair.')
    }
    const userId = userIdTokens[1]
    if (userId.trim().length === 0) {
      throw AppError.badRequest('username within oauth_resourceownerinfo is empty string.')
    }
    req.context.userId = userId.toUpperCase()
    next()
  }
}

module.exports = requestContextMiddlewareFunction
