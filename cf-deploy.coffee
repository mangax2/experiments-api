module.exports = (cfDeploy) ->
  {experimentsDataSource, experimentsExternalAPIUrls, experimentsVault} = cfDeploy.args
  deployable: '.'
  deployer: cfDeploy.deployers.awsDeployment
  diskLimit: "1G"
  instances: 2
  memoryLimit: "1G"
#  smokeTest: 'nonProd'
  environment:
    ENV: process.env.ENV
  route: 'experiments-api'
  startupCommand: 'npm start'
  services: [
    'expSys',
    "#{experimentsDataSource}",
    "#{experimentsVault}",
    "#{experimentsExternalAPIUrls}",
  ]
