module.exports = (cfDeploy) ->
  deployable: '.'
  deployer: cfDeploy.deployers.awsDeployment
  diskLimit: "512M"
  instances: 2
  memoryLimit: "512M"
#  smokeTest: 'nonProd'
  environment:
    ENV: process.env.ENV
  route: 'experiments-api'
  startupCommand: 'npm start'
  services: [
    'experimentsDataSource',
    'expSys',
    'experimentsVault'
  ]
