import _ from 'lodash'
import uuid from 'uuid/v4'
import AppError from '../services/utility/AppError'
import VaultUtil from '../services/utility/VaultUtil'
import HttpUtil from '../services/utility/HttpUtil'
import apiUrls from '../config/apiUrls'

const getUserIdFromOauthHeader = (oauthresourceownerinfo) => {
  const tokens = oauthresourceownerinfo.split(',')
  const userIdToken = _.find(tokens, token => token.startsWith('username'))

  if (userIdToken) {
    const userIdTokens = userIdToken.split('=')

    if (userIdTokens.length === 2) {
      const extractedUserId = userIdTokens[1].trim()

      return extractedUserId
    }
  }
  return undefined
}

function getContextFromHeaders(headers) {
  const context = {
    requestId: (headers ? headers['X-Request-Id'] : null) || uuid(),
  }

  if (headers && headers.oauth_resourceownerinfo) {
    const userNameFromOauth = getUserIdFromOauthHeader(headers.oauth_resourceownerinfo)
    const username = userNameFromOauth || headers.username
    context.isApiRequest = !userNameFromOauth
    context.userId = (username && username.length > 0
      ? username.toUpperCase()
      : undefined)
  }

  return context
}

/* istanbul ignore next */
function getClientIdFromToken(headers) {
  if (headers && headers.authorization) {
    const token = headers.authorization.substring(7)
    const url = `${apiUrls}/introspect.oauth2`
    const { clientId, clientSecret } = VaultUtil

    const postHeaders = [{ headerName: 'Content-Type', headerValue: 'application/x-www-form-urlencoded' }]
    const formData = { token, client_id: clientId, client_secret: clientSecret }

    return HttpUtil.postform(url, formData, postHeaders).then((data) => {
      if (data && data.body && data.body.client_id) {
        return data.body.client_id.toUpperCase()
      }

      return Promise.reject(new Error('Unable to resolve client id'))
    }).catch(err => Promise.reject(err))
  }

  return Promise.resolve('PD-EXPERIMENTS-API-DEV-SVC')
}

function requestContextMiddlewareFunction(req, res, next) {
  req.context = getContextFromHeaders(req.headers)
  res.set('X-Request-Id', req.context.requestId)
  res.set('Access-Control-Expose-Headers', 'X-Request-Id')

  if (_.startsWith(req.url, '/experiments-api-graphql/graphql')) {
    // Need to set a user if undefined for audit
    // Need to retrieve client id for audit

    if (req.context.userId === undefined) {
      req.context.userId = 'SERVICE-USER'
    }

    getClientIdFromToken(req.headers).then((clientId) => {
      req.context.clientId = clientId
      next()
    }).catch(/* istanbul ignore next */(err) => {
      console.warn(`[[${req.context.requestId}]] Error received when trying to retrieve client id.`, err)
      next()
    })
  } else {
    if (req.context.userId === undefined && _.includes(['POST', 'PUT', 'PATCH', 'DELETE'], req.method)) {
      throw AppError.badRequest('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
    }

    next()
  }
}

module.exports = requestContextMiddlewareFunction
