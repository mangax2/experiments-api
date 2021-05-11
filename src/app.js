require('./tracer')
require('../sqlMigration')
const config = require('../config')

if (config.node_env !== 'production') {
  // eslint-disable-next-line
  require('@babel/register')
}

const vaultConfig = require('./config/vaultConfig').default
const swaggerDoc = require('./swagger/swagger.json')
const graphqlSwaggerDoc = require('./swagger/graphqlSwagger')
const vaultUtil = require('./services/utility/VaultUtil')

process.on('unhandledRejection', (reason, p) => {
  // NOTE: THIS SHOULD BE A TEMPORARY METHOD UNTIL WE CAN FIGURE OUT HOW TO FIX ALL UNHANDLED!
  // THE MOST COMMON UNHANDLED IS Promise.all() WHERE THE CALLS ARE MAKING DB CALLS AND ONE FAILS
  // THIS CANCELS THE TRANSACTION AND CAUSES ANY OTHER CALLS TO TRY AND MAKE CALLS AGAINST
  // THE CLOSED CONNECTION. THAT THROWS UNHANDLED REJECTIONS.

  // IF WE DON'T HANDLE THESE REJECTIONS, FUTURE NODE VERSIONS WILL CRASH THE APP WHEN ONE HITS
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

vaultUtil.configureDbCredentials(config.env, config.vaultRoleId, config.vaultSecretId,
  vaultConfig)
  .then(() => {
    const kafkaConfig = require('./config/kafkaConfig').default
    const swaggerTools = require('swagger-tools')
    const express = require('express')
    const _ = require('lodash')
    const inflector = require('json-inflector')
    const bodyParser = require('body-parser')
    const promMetrics = require('@monsantoit/prom-metrics')
    const appBaseUrl = '/experiments-api'
    const graphqlBaseUrl = '/experiments-api-graphql'
    const { setErrorPrefix, setPromiseLibrary } = require('@monsantoit/error-decorator')()
    const lambdaPerformanceService = require('./services/prometheus/LambdaPerformanceService')
    const setEntryRemovalService = require('./services/prometheus/SetEntryRemovalService')
    const app = express()

    const prometheusClient = promMetrics(app)
    lambdaPerformanceService.setUpPrometheus(prometheusClient, 7)
    lambdaPerformanceService.setUpPrometheus(prometheusClient, 30)
    setEntryRemovalService.setUpPrometheus(prometheusClient)

    setPromiseLibrary(require('bluebird'))
    setErrorPrefix('EXP')
    require('./services/utility/AWSUtil').configure(vaultUtil.awsAccessKeyId, vaultUtil.awsSecretAccessKey)

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

    const compression = require('compression')
    app.use(compression())

    if (config.node_env === 'production') {
      const connectDatadog = require('connect-datadog')
      app.use(connectDatadog({
        protocol: true,
        base_url: true,
        method: true,
        path: true,
        response_code: true,
        tags: ['service:experiments-api', `env:${config.env}`],
      }))

      const customMetricsMiddleware = require('@monsantoit/custom-datadog-metrics-express-middleware')
      app.use(customMetricsMiddleware.default({
        environment: config.env,
        clientId: vaultUtil.clientId,
        clientSecret: vaultUtil.clientSecret,
        serviceName: 'experiments-api',
        appName: 'Experiments API',
      }))
    }

    const { makeExecutableSchema } = require('graphql-tools')
    const { importSchema } = require('graphql-import')
    const resolvers = require('./graphql/resolvers').default
    const typeDefs = importSchema('./src/graphql/schema.graphql')

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    const cors = require('cors')

    require('./graphql/GraphQLAuditManager').default.startInterval()
    app.use(`${graphqlBaseUrl}/graphql`, cors(), bodyParser.json({ limit: 1024 * 1024 * 40 }), require('./graphql/graphqlConfig')(schema))

    app.use(inflector())

    app.use(bodyParser.json({ limit: 1024 * 1024 * 40 }))

    app.use(appBaseUrl, bodyParser.json({ limit: 1024 * 1024 * 40 }), require('./routes/routes'))

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

    swaggerTools.initializeMiddleware(swaggerDoc, (middleware) => {
      app.use(appBaseUrl, middleware.swaggerUi())
    })

    swaggerTools.initializeMiddleware(graphqlSwaggerDoc, (middleware) => {
      app.use(graphqlBaseUrl, middleware.swaggerUi())
    })

    // Disabling lint for this app.use, removing 'next' parameter causes the errors to be
    // improperly formatted, but eslint says it is not being used.
    // eslint-disable-next-line
    app.use((err, req, res, next) => {
      // if the err is a superagent response, strip the request so we don't show a bearer token
      if (_.get(err, 'response.request')) {
        err.response.request = { toJSON: () => null }
      }
      if (err) {
        if (_.isArray(err)) {
          logError(err, req.context)
          return res.status(400).json(err)
        }

        if (err.status) {
          logError(err, req.context)
          return res.status(err.status).json(err)
        }

        logError(err, req.context)

        if (Object.hasOwnProperty.call(err, 'table') && Object.hasOwnProperty.call(err, 'schema')) {
          const pgerror = {
            status: 500,
            code: 'Internal Server Error',
            message: err.toString(),
            errorCode: err.errorCode,
          }
          return res.status(500).json(pgerror)
        }
        return res.status(500).json(err)
      }

      console.error(err, req.context)
      return res.status(500).json(err)
    })

    const { port } = config

    const server = app.listen(port, () => {
      const address = server.address()
      const url = `http://${address.host || 'localhost'}:${port}`
      return console.info(`Listening at ${url}`)
    })

    const logError = (err, context) => {
      if (err.stack) {
        console.error(`[[${context.requestId}]] ${err.errorCode}: ${err.stack}`)
      } else {
        console.error(`[[${context.requestId}]] ${err.errorCode}: ${err}`)
      }
    }

    const repPackingMessageConsume = () => {
      if (kafkaConfig.enableKafka === 'true') {
        try {
          require('./services/listeners/ManageRepsAndUnitsListener').manageRepsAndUnitsListener.listen()
        } catch (error) {
          console.error('Exception during Repacking message consume : ManageRepsAndUnitsListener.', error.stack)
        }
      } else {
        console.info('Experiments Kafka has been disabled for this session.')
      }
    }
    const setsChangesMessageConsume = () => {
      if (kafkaConfig.enableKafka === 'true') {
        try {
          require('./services/listeners/SetsChangesListener').setsChangesListener.listen()
        } catch (error) {
          console.error('Exception during SetsChanges message consume : SetsChangesListener.', error.stack)
        }
      } else {
        console.info('Sets Changes Kafka has been disabled for this session.')
      }
    }
    repPackingMessageConsume()
    setsChangesMessageConsume()


    server.timeout = 300000

    module.exports = app
  }).catch((err) => {
    console.error(err)
    config.exit()
  })
