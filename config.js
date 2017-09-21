const log4js = require('log4js')
const logger = log4js.getLogger('app')

let config = { vaultConfig: {} }

config.env = process.env.ENV || 'local'

config.port = process.env.PORT || 3001
config.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
config.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
config.node_env = process.env.NODE_ENV || 'local'
config.admin_group = process.env.ADMIN_GROUP || 'COSMOS-ADMIN'
if (config.env !== 'local' && config.node_env !== 'UNITTEST' && config.node_env !== 'test') {
  const cfServices = require('@monsantoit/cloud-foundry').services
  const vaultCfService = cfServices['experimentsVault']
  config.vaultConfig.baseUrl = vaultCfService.baseUrl
  config.vaultConfig.authUri = vaultCfService.authUri
  config.vaultConfig.secretUri = vaultCfService.secretUri
  config.vaultConfig.roleId = vaultCfService.roleId
  config.vaultConfig.secretId = vaultCfService.secretId
}
config.exit = function () {process.exit(1)}
config.watchUncaughtException = process.on('uncaughtException', function (error) {
  logger.fatal(error)
  logger.fatal('Fatal error encountered, exiting now')
  return config.exit
})

module.exports = config
