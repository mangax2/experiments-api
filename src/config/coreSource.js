const env = process.env.ENV === 'local' ? 'dev' : process.env

module.exports = {
  clientId: `vault://secret/cosmos/experiments/api/${env}/client/client_id`,
  clientSecret: `vault://secret/cosmos/experiments/api/${env}/client/client_secret`,

  databaseAppUser: `vault://secret/cosmos/experiments/api/${env}/db-write/appUser`,
  databaseAppUserPassword: `vault://secret/cosmos/experiments/api/${env}/db-write/appUserPassword`,
  databaseName: `vault://secret/cosmos/experiments/api/${env}/db-write/databaseName`,
  databaseHost: `vault://secret/cosmos/experiments/api/${env}/db-write/host`,
  databasePort: `vault://secret/cosmos/experiments/api/${env}/db-write/port`,
  databaseMin: `vault://secret/cosmos/experiments/api/${env}/db-write/min`,
  databaseMax: `vault://secret/cosmos/experiments/api/${env}/db-write/max`,
  databaseIdleTimeout: `vault://secret/cosmos/experiments/api/${env}/db-write/idleTimeout`,
  databaseCa: `vault://secret/cosmos/experiments/api/${env}/db-write/ca`,

  databaseRoAppUser: `vault://secret/cosmos/experiments/api/${env}/db-ro/appUser`,
  databaseRoAppUserPassword: `vault://secret/cosmos/experiments/api/${env}/db-ro/appUserPassword`,
  databaseRoName: `vault://secret/cosmos/experiments/api/${env}/db-ro/databaseName`,
  databaseRoHost: `vault://secret/cosmos/experiments/api/${env}/db-ro/host`,
  databaseRoPort: `vault://secret/cosmos/experiments/api/${env}/db-ro/port`,
  databaseRoMin: `vault://secret/cosmos/experiments/api/${env}/db-ro/min`,
  databaseRoMax: `vault://secret/cosmos/experiments/api/${env}/db-ro/max`,
  databaseRoIdleTimeout: `vault://secret/cosmos/experiments/api/${env}/db-ro/idleTimeout`,
  databaseRoCa: `vault://secret/cosmos/experiments/api/${env}/db-ro/ca`,
}
