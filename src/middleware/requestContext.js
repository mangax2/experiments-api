import _ from 'lodash'
import uuid from 'uuid/v4'
import AppError from '../services/utility/AppError'

function checkRegexMatches(regexes, url) {
  return _.compact(_.map(regexes, (r) => {
    const regExp = new RegExp(r)
    return regExp.exec(url) !== null
  })).length > 0
}

function getUserIdFromOauthHeader(headers) {
  if (headers && headers.oauth_resourceownerinfo) {
    const header = headers.oauth_resourceownerinfo
    const tokens = header.split(',')
    const userIdToken = _.find(tokens, token => token.startsWith('username'))

    if (userIdToken) {
      const userIdTokens = userIdToken.split('=')

      if (userIdTokens.length === 2) {
        const extractedUserId = userIdTokens[1].trim()

        return (extractedUserId.length > 0 ? extractedUserId.toUpperCase() : undefined)
      }
    }
  }

  return undefined
}

function requestContextMiddlewareFunction(req, res, next) {
  const userId = getUserIdFromOauthHeader(req.headers)
  req.context = {
    userId,
    requestId: (req.headers ? req.headers['X-Request-Id'] : null) || uuid(),
  }
  res.set('X-Request-Id', req.context.requestId)

  const whitelistedUrlRegexps = ['/experiments-api/graphql.*']

  if (!checkRegexMatches(whitelistedUrlRegexps, req.url) || (_.includes(['POST', 'PUT', 'PATCH', 'DELETE'], req.method) && userId === undefined)) {
    throw AppError.badRequest('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
  }

  next()
}

module.exports = requestContextMiddlewareFunction
