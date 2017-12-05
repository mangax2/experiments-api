import _ from 'lodash'
import AppError from '../services/utility/AppError'

function getUserIdFromOauthHeader(req) {
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

  return userId
}

function requestContextMiddlewareFunction(req, res, next) {
  const whitelistedUrls = ['/experiments-api/api-docs', '/metrics', '/experiments-api/ping', '/ping', '/experiments-api/docs/']
  const whitelistedExtensions = ['.png', '.jpg', '.md', '.js', '.css']

  if (_.endsWith(req.url, '/permissions')) {
    const userId = getUserIdFromOauthHeader(req)
    req.context = {
      userId: userId.toUpperCase(),
    }
    next()
  } else if (whitelistedUrls.includes(req.url)
    || (req.url && _.filter(whitelistedExtensions, ext => req.url.endsWith(ext)).length > 0)
    || (req.method === 'GET')) {
    next()
  } else {
    const userId = getUserIdFromOauthHeader(req)
    req.context = {
      userId: userId.toUpperCase(),
    }
    next()
  }
}

module.exports = requestContextMiddlewareFunction
