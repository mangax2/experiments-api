const datadogEnvMap = {
  dev: 'develop',
  np: 'nonprod',
  prod: 'prod',
}

const datadogEnv = datadogEnvMap[process.env.VAULT_ENV]
const datadogService = `exp-api-${process.env.VAULT_ENV}`

const tracer = require('dd-trace').init({
  debug: true,
  runtimeMetrics: true,
  env: datadogEnv,
  service: datadogService,
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
