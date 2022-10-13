const tracer = require('dd-trace')

tracer.init({
  enabled: true,
  logInjection: false,
  debug: false,
  analytics: true,
  runtimeMetrics: true,
})

tracer.use('http', {
  blocklist: ['/ping'],
})

tracer.use('express', {
  hooks: {
    request: (span, req) => {
      if (req.context) {
        span.setTag('request_id', req.context.requestId)
        span.setTag('is_api_request', req.context.isApiRequest)
        span.setTag('client.id', req.context.clientId)
        span.setTag('client.user_id', req.context.userId)
      }
    },
  },
})

module.exports = tracer
