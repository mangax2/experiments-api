module.exports = (cfDeploy) ->
  deployable: '.'
  deployer: cfDeploy.deployers.awsDeployment
  diskLimit: "512M"
  instances: 2
  memoryLimit: "512M"
#  smokeTest: 'nonProd'
  environment:
    ENV: process.env.ENV
    EXPERIMENTS_DB_LOCAL_USER: process.env.EXPERIMENTS_DB_LOCAL_USER
    EXPERIMENTS_DB_LOCAL_PASSWORD: process.env.EXPERIMENTS_DB_LOCAL_PASSWORD
  route: 'experiments-api'
  startupCommand: 'npm start'
  services: [
    'experimentsDataSource',
    'expSys',
    'experimentsVault'
  ]
