import config from '../../../config'

let cfServices, dbPassword, services

const automationSpecEnv = config.node_env !== 'production' && config.env === 'nonprod'
const localEnv = config.env !== 'prod' && config.env !== 'nonprod'

cfServices = localEnv ? (console.info('environment is local'), require('./localEnvConfig')) : automationSpecEnv ? (console.info('environment is aws nonprod'), require('./automationTestDBConfig')) : (console.info('environment is aws cf'), services = require('@monsantoit/cloud-foundry').services, dbPassword = config.db_password, services['experimentsDataSource'].password = dbPassword, services)

module.exports = cfServices
