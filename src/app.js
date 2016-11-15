require('../log4js-conf')()

const config = require('../config')
const swaggerDoc = require('./swagger/swagger.json')
const swaggerTools = require('swagger-tools')
if (config.node_env !== 'production') {
    require('babel-register')
}
const express = require('express')
const _ = require('lodash')
const inflector = require('json-inflector')
const bodyParser = require('body-parser')
const log4js = require('log4js')
const logger = log4js.getLogger('app')
const appBaseUrl = '/experiments-api'
const app = express()

const requestContext = require('./middleware/requestContext')
app.use(requestContext)

app.use(inflector())
const pingFunc = (function () {
    var createPingPage, i, len, pingPage, ref, results
    createPingPage = require('@monsantoit/ping-page')
    pingPage = createPingPage(require('../package.json'))
    ref = ['/ping', appBaseUrl + '/ping']
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
        const path = ref[i]
        results.push(app.get(path, pingPage))
    }
    return results
})()

const compression = require('compression')
app.use(compression())
app.use(bodyParser.json())

app.use(appBaseUrl, require('./routes/routes'))

swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
    app.use(appBaseUrl, middleware.swaggerUi())
})


app.use(function (err, req, res, next) {
   // const errorLogMessage = _.keys(req.route.methods)[0].toUpperCase() + " " + req.route.path + " - "
    const errorLogMessage=""
    if (err) {
        if (_.isArray(err)) {
            logger.error(errorLogMessage + JSON.stringify(err))
            return res.status(400).json(err)
        } else {
            if (err.status) {
                logger.error(errorLogMessage + err)
                return res.status(err.status).json(err)
            } else {
                logger.error(errorLogMessage + err)
                return res.status(500).json(err)
            }
        }
    }
    else {
        logger.error(errorLogMessage + err)
        return res.status(500).json(err)
    }
})


const port = config.port

const server = app.listen(port, function () {
    const address = server.address()
    const url = 'http://' + (address.host || 'localhost') + ':' + port
    return logger.info('Listening at ' + url)
})

module.exports = app