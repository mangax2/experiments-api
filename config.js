
const {
  ENV,
  PORT,
  NODE_ENV,
  ADMIN_GROUP,
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

config.exit = function () {process.exit(1)}
config.watchUncaughtException = process.on('uncaughtException', function (error) {
  console.error(error)
  console.error('Fatal error encountered, exiting now')
  return config.exit
})

module.exports = config

