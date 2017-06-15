const agent = require('superagent')
const _ = require('lodash')

class HttpUtil {

  static get(url, headers) {
    return HttpUtil.setHeaders(agent.get(url), headers)
  }

  static getWithRetry(url, headers, retryCount = 0) {
    return HttpUtil.setHeaders(agent.get(url), headers)
      .catch((error) => {
        if (retryCount < 2) {
          return HttpUtil.getWithRetry(url, headers, retryCount + 1)
        }
        return Promise.reject(error)
      })
  }

  static post(url, headers, data) {
    return HttpUtil.setHeaders(agent.post(url), headers).send(data)
  }

  static put(url, headers, data) {
    return HttpUtil.setHeaders(agent.put(url), headers).send(data)
  }

  static delete(url, headers) {
    return HttpUtil.setHeaders(agent.delete(url), headers)
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
      } else if (err.response) {
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
}

module.exports = HttpUtil
