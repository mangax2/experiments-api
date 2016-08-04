automationSpecEnv = process.env.NODE_ENV != 'production' && process.env.ENV=='nonprod'
localEnv = process.env.ENV != 'prod' && process.env.ENV!='nonprod'
cfServices =
  if automationSpecEnv
    console.log 'environment is aws nonprod'
    require('./automationTestDBConfig')
  else
    console.log 'environment is aws cf'
    services = require('@monsantoit/cloud-foundry').services
    dbPassword = process.env.DB_PASSWORD
    services['experimentsDataSource'].password = dbPassword
    services

module.exports = cfServices
