module.exports = (cfDeploy) ->
  {experimentsDataSource, experimentsExternalAPIUrls, experimentsKafka, velocityHome} = cfDeploy.args
  deployable: '.'
  deployer: cfDeploy.deployers.awsDeployment
  diskLimit: "1G"
  instances: 2
  memoryLimit: "1G"
#  smokeTest: 'nonProd'
  environment:
    ENV: process.env.ENV
    CLOUDFRONT_PK: process.env.CLOUDFRONT_PK
    vaultRoleId: process.env.vaultRoleId
    vaultSecretId: process.env.vaultSecretId
    vaultMigrationRoleId: process.env.vaultMigrationRoleId
    vaultMigrationSecretId: process.env.vaultMigrationSecretId
  route: 'experiments-api'
  startupCommand: 'node sqlMigration.js && npm start'
  services: [
    'expSys',
    'vault',
    "#{velocityHome}",
    "#{experimentsDataSource}",
    "#{experimentsExternalAPIUrls}",
    "#{experimentsKafka}",
  ]
