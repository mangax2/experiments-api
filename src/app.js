require('../log4js-conf')()
const config = require('../config')
const swaggerDoc = require('./swagger/swagger.json')
const swaggerTools = require('swagger-tools')
const vaultUtil = require('./services/utility/VaultUtil')

vaultUtil.configureDbCredentials(config.env, config.vaultConfig).then(() => {
  if (config.node_env !== 'production') {
    //eslint-disable-next-line
    require('babel-register')
  }

  const serviceConfig = require('./services/utility/ServiceConfig')
  const express = require('express')
  const _ = require('lodash')
  const inflector = require('json-inflector')
  const bodyParser = require('body-parser')
  const log4js = require('log4js')
  const promMetrics = require('@monsantoit/prom-metrics')
  const logger = log4js.getLogger('app')
  const appBaseUrl = '/experiments-api'
  const app = express()

  promMetrics(app)

  const requestContext = require('./middleware/requestContext')

  if (config.node_env === 'development') {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
        if (req.headers['access-control-request-method']) {
          res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
        }
        next()
      } else {
        requestContext(req, res, next)
      }
    })
  } else {
    app.use(requestContext)
  }

  app.use(inflector())
  const pingFunc = (function () {
    const createPingPage = require('@monsantoit/ping-page')
    const pingPage = createPingPage(require('../package.json'))
    const ref = ['/ping']
    const results = []
    let i
    let len
    for (i = 0, len = ref.length; i < len; i += 1) {
      const path = ref[i]
      results.push(app.get(path, pingPage))
    }
    return results
  })

  pingFunc()

  const compression = require('compression')
  app.use(compression())
  app.use(bodyParser.json({ limit: 1024 * 1024 * 40 }))

  app.use(appBaseUrl, require('./routes/routes'))

  swaggerTools.initializeMiddleware(swaggerDoc, (middleware) => {
    app.use(appBaseUrl, middleware.swaggerUi())
  })

  // Disabling lint for this app.use, removing 'next' parameter causes the errors to be
  // improperly formatted, but eslint says it is not being used.
  //eslint-disable-next-line
  app.use((err, req, res, next) => {
    if (err) {
      if (_.isArray(err)) {
        logError(err, req.context)
        return res.status(400).json(err)
      } else if (err.status) {
        logError(err, req.context)
        return res.status(err.status).json(err)
      }

      logError(err, req.context)

      if (Object.hasOwnProperty.call(err, 'table') && Object.hasOwnProperty.call(err, 'schema')) {
        const pgerror = {
          status: 500,
          code: 'Internal Server Error',
          message: err.toString(),
        }
        return res.status(500).json(pgerror)
      }
      return res.status(500).json(err)
    }

    logger.error(err, req.context)
    return res.status(500).json(err)
  })

  const port = config.port

  const server = app.listen(port, () => {
    const address = server.address()
    const url = `http://${address.host || 'localhost'}:${port}`
    return logger.info(`Listening at ${url}`)
  })

  const logError = (err, context) => {
    if (err.stack) {
      logger.error(`[[${context.requestId}]] ${err.stack}`)
    } else {
      logger.error(`[[${context.requestId}]] ${err}`)
    }
  }

  const repPackingMessageConsume = () => {
    if (serviceConfig.experimentsKafka.value.enableKafka === 'true') {
      try {
        require('./services/listeners/ManageRepsAndUnitsListener').manageRepsAndUnitsListener.listen()
      } catch (error) {
        logger.error('Exception during Repacking message consume : ManageRepsAndUnitsListener.', error.stack)
      }
    } else {
      logger.info('Kafka has been disabled for this session.')
    }
  }
  repPackingMessageConsume()


  server.timeout = 300000

  module.exports = app
}).catch((err) => {
  console.error(err)
  config.exit()
})
