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
    request: (span, req, res) => {
      span.setTag('client_id', req.context.clientId)
      span.setTag('user_id', req.context.userId)
    },
  },
})

module.exports = tracer
