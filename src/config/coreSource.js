const env = process.env.ENV === 'local' ? 'dev' : process.env
const formatVaultPath = relativePath => `vault://secret/cosmos/experiments/api/${env}/${relativePath}`

module.exports = {
  clientId: formatVaultPath('client/client_id'),
  clientSecret: formatVaultPath('client/client_secret'),

  databaseAppUser: formatVaultPath('db-write/appUser'),
  databaseAppUserPassword: formatVaultPath('db-write/appUserPassword'),
  databaseName: formatVaultPath('db-write/databaseName'),
  databaseHost: formatVaultPath('db-write/host'),
  databasePort: formatVaultPath('db-write/port'),
  databaseMin: formatVaultPath('db-write/min'),
  databaseMax: formatVaultPath('db-write/max'),
  databaseIdleTimeout: formatVaultPath('db-write/idleTimeout'),
  databaseCa: formatVaultPath('db-write/ca'),

  databaseRoAppUser: formatVaultPath('db-ro/appUser'),
  databaseRoAppUserPassword: formatVaultPath('db-ro/appUserPassword'),
  databaseRoName: formatVaultPath('db-ro/databaseName'),
  databaseRoHost: formatVaultPath('db-ro/host'),
  databaseRoPort: formatVaultPath('db-ro/port'),
  databaseRoMin: formatVaultPath('db-ro/min'),
  databaseRoMax: formatVaultPath('db-ro/max'),
  databaseRoIdleTimeout: formatVaultPath('db-ro/idleTimeout'),
  databaseRoCa: formatVaultPath('db-ro/ca'),
}
