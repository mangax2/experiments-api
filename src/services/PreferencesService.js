import _ from 'lodash'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import apiUrls from '../config/apiUrls'
import AppError from './utility/AppError'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1XXXXX
class PreferencesService {
  @setErrorCode('1X1000')
  handlePreferencesAPIError = (err, errorCode) => {
    if (err.status === 400) {
      return AppError.badRequest('Bad Request', undefined, errorCode)
    }

    if (err.status === 401) {
      return AppError.unauthorized('Unauthorized', undefined, errorCode)
    }

    if (err.status === 403) {
      return AppError.forbidden('Forbidden', undefined, errorCode)
    }

    if (err.status === 404) {
      return AppError.badRequest('Preferences not found', undefined, errorCode)
    }

    return {
      status: 500,
      code: 'Internal Server Error',
      message: `Error received from Preferences API. ${err.response.text}`,
      errorCode,
    }
  }

  @setErrorCode('1X2000')
  getPreferences = (namespace, subNamespace, authorizationHeader, context) =>
    PingUtil.getMonsantoHeader()
      .then((headers) => {
      // replace the auth header with a user authheader
        const authHeader = _.find(headers, header => header.headerName === 'authorization')
        authHeader.headerValue = authorizationHeader
        return HttpUtil.get(`${apiUrls.preferencesAPIUrl}/user/${namespace}/${subNamespace}`, headers)
          .catch((err) => {
            console.error(`[[${context.requestId}]] Error received from Preferences API.`, err)
            throw this.handlePreferencesAPIError(err, getFullErrorCode('1X2001'))
          })
      })

  @setErrorCode('1X3000')
  setPreferences = (namespace, subNamespace, preferences, authorizationHeader, context) =>
    PingUtil.getMonsantoHeader()
      .then((headers) => {
      // replace the auth header with a user authheader
        const authHeader = _.find(headers, header => header.headerName === 'authorization')
        authHeader.headerValue = authorizationHeader
        return HttpUtil.put(`${apiUrls.preferencesAPIUrl}/user/${namespace}/${subNamespace}`, headers, preferences)
          .catch((err) => {
            console.error(`[[${context.requestId}]] Error received from Preference API.`, err)
            throw this.handlePreferencesAPIError(err, getFullErrorCode('1X3001'))
          })
      })
}

module.exports = PreferencesService
