localDevelopment = process.env.NODE_ENV != 'production'
cfServices =
  if localDevelopment
    console.log 'environment is local'
    require('./localEnvConfig')
  else
    console.log 'environment is aws cf'
    services = require('@monsantoit/cloud-foundry').services
    dbPassword = process.env.DB_PASSWORD
    services['experimentsDataSource'].password = dbPassword
    services

module.exports = cfServices
