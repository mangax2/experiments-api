module.exports = (cfDeploy) ->
  {experimentsDataSource, experimentsExternalAPIUrls, experimentsVault, experimentsKafka} = cfDeploy.args
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
  startupCommand: 'npm start'
  services: [
    'expSys',
    'velocity-home',
    "#{experimentsDataSource}",
    "#{experimentsVault}",
    "#{experimentsExternalAPIUrls}",
    "#{experimentsKafka}",
  ]
