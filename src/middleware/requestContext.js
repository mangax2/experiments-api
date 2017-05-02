import _ from 'lodash'
import AppError from '../services/utility/AppError'

function requestContextMiddlewareFunction(req, res, next) {
  const whitelistedUrls = ['/experiments-api/api-docs', '/metrics', '/experiments-api/ping', '/ping']

  if (whitelistedUrls.includes(req.url) || (req.url && (req.url.includes('.png') || req.url.includes('.jpg') || req.url.includes('.md')))) {
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
    const userIdToken = _.find(tokens, token => token.startsWith('user_id'))
    if (!userIdToken) {
      throw AppError.badRequest('user_id not found within oauth_resourceownerinfo.')
    }
    const userIdTokens = userIdToken.split('=')
    if (userIdTokens.length !== 2) {
      throw AppError.badRequest('user_id within oauth_resourceownerinfo does not represent key=value pair.')
    }
    const userId = userIdTokens[1]
    if (userId.trim().length === 0) {
      throw AppError.badRequest('user_id within oauth_resourceownerinfo is empty string.')
    }
    req.context = {
      userId,
    }
    next()
  }
}

module.exports = requestContextMiddlewareFunction
