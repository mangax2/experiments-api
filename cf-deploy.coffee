module.exports = (cfDeploy) ->
  {experimentsDataSource, experimentsExternalAPIUrls, experimentsVault, experimentsKafka, velocityHome} = cfDeploy.args
  deployable: '.'
  deployer: cfDeploy.deployers.awsDeployment
  diskLimit: "1G"
  instances: 2
  memoryLimit: "1G"
#  smokeTest: 'nonProd'
  environment:
    ENV: process.env.ENV
    CLOUDFRONT_PK: process.env.CLOUDFRONT_PK
  route: 'experiments-api'
  startupCommand: 'node sql-migration.js && npm start'
  services: [
    'expSys',
    "#{velocityHome}",
    "#{experimentsDataSource}",
    "#{experimentsVault}",
    "#{experimentsExternalAPIUrls}",
    "#{experimentsKafka}",
  ]
