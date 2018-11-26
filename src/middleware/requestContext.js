import log4js from 'log4js'
import _ from 'lodash'
import uuid from 'uuid/v4'
import AppError from '../services/utility/AppError'
import cfServices from '../services/utility/ServiceConfig'
import HttpUtil from '../services/utility/HttpUtil'

const logger = log4js.getLogger('experiments-api-request-context')

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

/* istanbul ignore next */
function getClientIdFromToken(headers) {
  if (headers && headers.authorization) {
    const token = headers.authorization.substring(7)
    const url = cfServices.pingDataSource.introspectionUrl
    const { clientId, clientSecret } = cfServices.pingDataSource

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
  const userId = getUserIdFromOauthHeader(req.headers)
  req.context = {
    userId,
    requestId: (req.headers ? req.headers['X-Request-Id'] : null) || uuid(),
  }
  res.set('X-Request-Id', req.context.requestId)
  res.set('Access-Control-Expose-Headers', 'X-Request-Id')

  if (_.startsWith(req.url, '/experiments-api/graphql')) {
    // Need to set a user if undefined for audit
    // Need to retrieve client id for audit

    if (userId === undefined) {
      req.context.userId = 'SERVICE-USER'
    }

    getClientIdFromToken(req.headers).then((clientId) => {
      req.context.clientId = clientId
      next()
    }).catch(/* istanbul ignore next */(err) => {
      logger.warn(`[[${req.context.requestId}]] Error received when trying to retrieve client id.`, err)
      next()
    })
  } else {
    if (userId === undefined && _.includes(['POST', 'PUT', 'PATCH', 'DELETE'], req.method)) {
      throw AppError.badRequest('oauth_resourceownerinfo header with username=<user_id> value is invalid/missing')
    }

    next()
  }
}

module.exports = requestContextMiddlewareFunction
