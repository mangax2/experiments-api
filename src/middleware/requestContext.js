import _ from 'lodash'
import uuid from 'uuid/v4'
import AppError from '../services/utility/AppError'

const getUserIdFromOauthHeader = (oauthresourceownerinfo) => {
  if (_.isUndefined(oauthresourceownerinfo)) { return undefined }
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

function getContextFromHeaders(headers = {}) {
  const context = {
    requestId: (headers ? headers['X-Request-Id'] : null) || uuid(),
  }

  const userNameFromOauth = getUserIdFromOauthHeader(headers.oauth_resourceownerinfo)
  const username = userNameFromOauth || headers['x-bayer-cwid'] || headers.username
  context.isApiRequest = !userNameFromOauth
  context.userId = (username && username.length > 0)
    ? username.toUpperCase()
    : undefined

  return context
}

function getClientIdFromToken(headers) {
  let clientId
  if (headers && headers.authorization) {
    const token = headers.authorization.substring(7)

    if (token && token.length > 50) {
      clientId = getClientIdFromAzureADToken(token) || 'UNKNOWN AzureAD Client'
    } else {
      clientId = 'UNKNOWN Ping Client'
    }
  }

  return clientId || 'PD-EXPERIMENTS-API-DEV-SVC'
}

function getClientIdFromAzureADToken(token) {
  try {
    const encodedClientInfo = token.split('.')[1]

    if (encodedClientInfo) {
      const clientInfoBuffer = Buffer.from(encodedClientInfo, 'base64')
      const clientInfo = JSON.parse(clientInfoBuffer.toString('utf8'))
      return clientInfo['https://bayer.com/app_displayname'] || clientInfo.appid
    }
  } catch {
    console.warn('An error occurred while retrieving client id from AzureAD token')
  }
  return undefined
}

function requestContextMiddlewareFunction(req, res, next) {
  req.context = getContextFromHeaders(req.headers)
  res.set('X-Request-Id', req.context.requestId)
  res.set('Access-Control-Expose-Headers', 'X-Request-Id')

  if (
    !_.startsWith(req.url, '/experiments-api-graphql/graphql')
    && req.context.userId === undefined
    && _.includes(['POST', 'PUT', 'PATCH', 'DELETE'], req.method)
  ) {
    throw AppError.badRequest('username value is invalid/missing in header')
  }

  if (req.context.userId === undefined) {
    req.context.userId = 'SERVICE-USER'
  }
  req.context.clientId = getClientIdFromToken(req.headers)
  next()
}

module.exports = requestContextMiddlewareFunction
