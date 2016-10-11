const config = require('../config')

if (config.node_env !== 'production') {
    require('babel-register')
}
const express = require('express')
const _ = require('lodash')
const createProfileMiddleware = require('@monsantoit/profile-middleware')
const inflector = require('json-inflector')
const bodyParser = require('body-parser')
const log4js = require('log4js')
const logger = log4js.getLogger('app')
// const localDevelopment = config.node_env !== 'production'
const appBaseUrl = '/experiments-api'
const app = express()
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

const localDevProfile = {
    id: 'testuser'
}

// app.use(createProfileMiddleware({
//     localDevProfile: localDevProfile
// }))

app.use('/experiments-api', require('./routes/routes'))
app.use(function (err, req, res, next) {
    if (err) {
        if (_.isArray(err)) {
            const errorArray = _.map(err, function (x) {
                return (x)
            })
            return res.status(400).json(errorArray)
        } else {
            if (err.status) {
                return res.status(err.status).json(err)
            } else {
                return res.status(500).json(err)
            }
        }
    }
    else {
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