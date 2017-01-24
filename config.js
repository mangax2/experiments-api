const log4js = require('log4js')
const logger = log4js.getLogger('app')
const cfServices = require('@monsantoit/cloud-foundry').services

var config = {vaultConfig:{}}

config.env = process.env.ENV || 'local'
config.port = process.env.PORT || 3001
config.node_env = process.env.NODE_ENV || 'local'
config.postgres_password = process.env.POSTGRES_PASSWORD
config.db_password = process.env.DB_PASSWORD
config.role_id= process.env.ROLE_ID
config.secret_id= process.env.SECRET_ID
if(config.env!='local'){
    const vaultCfService= cfServices['experimentsVault']
    config.vaultConfig.baseUrl = vaultCfService.baseUrl
    config.vaultConfig.authUri = vaultCfService.authUri
    config.vaultConfig.secretUri = vaultCfService.secretUri
    config.vaultConfig.roleId = vaultCfService.roleId
    config.vaultConfig.secretId = vaultCfService.secretId
}
config.exit = function(){process.exit(1)}
config.watchUncaughtException = process.on('uncaughtException', function(error) {
    logger.fatal(error)
    logger.fatal('Fatal error encountered, exiting now')
    return config.exit
})

module.exports = config
