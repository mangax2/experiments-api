import config from '../../../config'

let cfServices, services

const automationSpecEnv = config.node_env !== 'production' && config.env === 'nonprod'
const localEnv = config.env !== 'prod' && config.env !== 'nonprod'

if (localEnv) {
    console.info('environment is local')
    cfServices = require('./localEnvConfig')
} else {
    if (automationSpecEnv) {
        console.info('environment is aws nonprod')
        cfServices = require('./automationTestDBConfig')
    } else {
        console.info('environment is aws cf')
        services = require('@monsantoit/cloud-foundry').services
        services['experimentsDataSource'].password = config.db_password
        cfServices = services
    }
}

module.exports = cfServices
