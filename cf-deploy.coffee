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
    EXPERIMENTS_DB_LOCAL_USER: process.env.EXPERIMENTS_DB_LOCAL_USER
    EXPERIMENTS_DB_LOCAL_PASSWORD: process.env.EXPERIMENTS_DB_LOCAL_PASSWORD
    EXPERIMENTS_API_CLIENT_ID: process.env.EXPERIMENTS_API_CLIENT_ID
    EXPERIMENTS_API_CLIENT_SECRET: process.env.EXPERIMENTS_API_CLIENT_SECRET
  route: 'experiments-api'
  startupCommand: 'npm start'
  services: [
    'expSys',
    "#{experimentsDataSource}",
    "#{experimentsVault}",
    "#{experimentsExternalAPIUrls}",
  ]
