import config from '../../../config'
import VaultUtil from './VaultUtil'
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
        services['experimentsDataSource'].user = VaultUtil.dbAppUser
        services['experimentsDataSource'].password = VaultUtil.dbAppPassword
        services['experimentsDataSource'].ssl= true
        cfServices = services
    }
}

module.exports = cfServices
