const log4js = require('log4js')
const logger = log4js.getLogger('app')
const {
  ENV,
  PORT,
  NODE_ENV,
  ADMIN_GROUP,
  KAFKA_PASSWORD,
  EXPERIMENTS_API_CLIENT_ID,
  vaultRoleId,
  vaultSecretId,
} = process.env

let config = { vaultConfig: {} }

config.env = ENV || 'local'
config.port = PORT || 3001
config.node_env = NODE_ENV || 'local'
config.admin_group = ADMIN_GROUP || 'COSMOS-ADMIN'
config.vaultRoleId = vaultRoleId
config.vaultSecretId = vaultSecretId

if (config.env !== 'local' && config.node_env !== 'UNITTEST' && config.node_env !== 'test') {
  const cfServices = require('@monsantoit/cloud-foundry').services
  const vaultCfService = cfServices['vault']
  config.vaultConfig.baseUrl = vaultCfService.baseUrl
  config.vaultConfig.authUri = vaultCfService.authUri
  config.vaultConfig.secretUri = vaultCfService.secretUri
}

if (config.env !== 'prod' && config.env !== 'np' && config.env !== 'dev') {
  config.vaultConfig.kafkaPassword = KAFKA_PASSWORD
  config.vaultConfig.clientId = EXPERIMENTS_API_CLIENT_ID
}

config.exit = function () {process.exit(1)}
config.watchUncaughtException = process.on('uncaughtException', function (error) {
  logger.fatal(error)
  logger.fatal('Fatal error encountered, exiting now')
  return config.exit
})

module.exports = config

