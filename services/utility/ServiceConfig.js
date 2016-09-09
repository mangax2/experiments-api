let cfServices, dbPassword, services;

const automationSpecEnv = process.env.NODE_ENV !== 'production' && process.env.ENV === 'nonprod'
const localEnv = process.env.ENV !== 'prod' && process.env.ENV !== 'nonprod'

cfServices = localEnv ? (console.log('environment is local'), require('./localEnvConfig')) : automationSpecEnv ? (console.log('environment is aws nonprod'), require('./automationTestDBConfig')) : (console.log('environment is aws cf'), services = require('@monsantoit/cloud-foundry').services, dbPassword = process.env.DB_PASSWORD, services['experimentsDataSource'].password = dbPassword, services);

module.exports = cfServices
