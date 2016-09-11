const log4js = require('log4js')
const logger = log4js.getLogger('app')

var config = {}

config.env = process.env.NODE_ENV || 'local'
config.port = process.env.PORT || 3000
config.node_env = process.env.NODE_ENV || 'local'
config.postgres_password = process.env.POSTGRES_PASSWORD
config.db_password = process.env.DB_PASSWORD
config.exit = function(){process.exit(1)}
config.watchUncaughtException = process.on('uncaughtException', function(error) {
    logger.fatal(error)
    logger.fatal('Fatal error encountered, exiting now')
    return config.exit
})

module.exports = config
