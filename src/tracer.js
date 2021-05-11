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

module.exports = tracer
