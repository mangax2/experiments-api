#TODO update for experiments local db
cfServices =
  experimentsDataSource:
    alias: 'experimentsDataSource'
    host: 'velocity-experiments-db.c6ftfip45sqv.us-east-1.rds.amazonaws.com'
    port: '5432'
    user: 'experiments_user_s'
    password: process.env.POSTGRES_PASSWORD
    database: 'nonprod'
    type: 'conn'
    min: 10
    max: 10
    idleTimeoutMillis: 30000

module.exports = cfServices
