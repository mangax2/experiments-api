const agent = require('superagent')
const _ = require('lodash')
const log4js = require('log4js')

const logger = log4js.getLogger('HttpUtilService')

class HttpUtil {
  static get(url, headers, threshold = 10000) {
    const startTimeMillis = new Date().getTime()
    return HttpUtil.setHeaders(agent.get(url), headers).then((result) => {
      HttpUtil.logExternalTime(startTimeMillis, threshold, url, 'GET')
      return result
    })
  }

  static getWithRetry(url, headers, retryCount = 0, threshold = 10000) {
    const startTimeMillis = new Date().getTime()
    return HttpUtil.setHeaders(agent.get(url), headers).then((result) => {
      HttpUtil.logExternalTime(startTimeMillis, threshold, url, 'GET')
      return result
    }).catch((error) => {
      if (retryCount < 2) {
        return HttpUtil.getWithRetry(url, headers, retryCount + 1)
      }
      return Promise.reject(error)
    })
  }

  static patch(url, headers, data, threshold = 20000) {
    const startTimeMillis = new Date().getTime()
    return HttpUtil.setHeaders(agent.patch(url), headers).send(data).then((result) => {
      HttpUtil.logExternalTime(startTimeMillis, threshold, url, 'PATCH')
      return result
    })
  }

  static post(url, headers, data, threshold = 20000) {
    const startTimeMillis = new Date().getTime()
    return HttpUtil.setHeaders(agent.post(url), headers).send(data).then((result) => {
      HttpUtil.logExternalTime(startTimeMillis, threshold, url, 'POST')
      return result
    })
  }

  static postform(url, formData, headers, threshold = 20000) {
    const startTimeMillis = new Date().getTime()
    return HttpUtil.setHeaders(agent.post(url).type('form'), headers).send(formData)
      .then((result) => {
        HttpUtil.logExternalTime(startTimeMillis, threshold, url, 'POSTFORM')
        return result
      })
  }

  static put(url, headers, data, threshold = 20000) {
    const startTimeMillis = new Date().getTime()
    return HttpUtil.setHeaders(agent.put(url), headers).send(data).then((result) => {
      HttpUtil.logExternalTime(startTimeMillis, threshold, url, 'PUT')
      return result
    })
  }

  static delete(url, headers, threshold = 10000) {
    const startTimeMillis = new Date().getTime()
    return HttpUtil.setHeaders(agent.delete(url), headers).then((result) => {
      HttpUtil.logExternalTime(startTimeMillis, threshold, url, 'DELETE')
      return result
    })
  }

  static setHeaders(httpCall, headers) {
    _.forEach(headers, (h) => {
      httpCall.set(h.headerName, h.headerValue)
    })
    return httpCall
  }

  static getErrorMessageForLogs(err) {
    if (err) {
      if (err.status === 401) {
        return 'Unauthorized'
      }

      if (err.response) {
        const error = JSON.parse(err.response.text)

        if (_.isArray(error)) {
          return _.map(error, 'errorMessage').join()
        }

        if (error.errorMessage) {
          return error.errorMessage
        }
      }
    }
    return 'Unable to retrieve error message.'
  }

  // Ignoring code coverage. Mocking out log4js at start, else we'd get a lot of logs in our test
  /* istanbul ignore next */
  static logExternalTime(startTime, threshold, url, operation) {
    const endTime = new Date().getTime()
    const totalTime = endTime - startTime

    if (totalTime >= threshold) {
      logger.warn(`${operation} call on ${url} took ${totalTime / 1000} seconds to complete`)
    } else {
      logger.debug(`${operation} call on ${url} took ${totalTime / 1000} seconds to complete`)
    }
  }
}

module.exports = HttpUtil
