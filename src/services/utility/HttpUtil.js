var agent = require('superagent')
const _ = require('lodash')

class HttpUtil {
    static get(url,headers) {
        return HttpUtil.setHeaders(agent.get(url), headers)
    }

    static post(url, headers, data) {
        return HttpUtil.setHeaders(agent.post(url), headers).send(data)
    }

    static setHeaders(httpCall, headers) {
        _.forEach(headers, (h)=>{
            httpCall.set(h.headerName, h.headerValue)
        })
        return httpCall
    }

}

module.exports = HttpUtil