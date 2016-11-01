import AppError from '../services/utility/AppError'
import _ from 'lodash'

function requestContextMiddlewareFunction(req, res, next) {
    console.log('In context function')
    console.log('Headers ' + Object.keys(req.headers))
    const header = req.headers['oauth_resourceownerinfo']
    console.log('Have header: ' + header)
    if (!header) {
        throw AppError.badRequest('oauth_resourceownerinfo header not found.')
    }
    console.log('Header found: ' + header)

    const tokens = header.split(',')

    console.log('Tokens found: ' + tokens.toString())

    const userIdToken = _.find(tokens, (token) => {
        return token.startsWith('user_id');
    })
    if (!userIdToken) {
        throw AppError.badRequest('user_id not found within oauth_resourceownerinfo.')
    }

    console.log('User ID token found ' + userIdToken)

    const userIdTokens = userIdToken.split('=')
    if (userIdTokens.length != 2) {
        throw AppError.badRequest('user_id within oauth_resourceownerinfo does not represent key=value pair.')
    }
    console.log('User ID found ' + userIdTokens)

    const userId = userIdTokens[1]

    if (userId.trim().length == 0) {
        throw AppError.badRequest('user_id within oauth_resourceownerinfo is empty string.')
    }

    console.log('User ID ' + userId)

    req.context = {
        userId: userId
    }

    next()
}

module.exports = requestContextMiddlewareFunction