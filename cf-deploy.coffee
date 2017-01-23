module.exports = (cfDeploy) ->
  {postgresPassword} = cfDeploy.args

  deployable: '.'
  deployer: cfDeploy.deployers.awsDeployment
  diskLimit: "512M"
  instances: 2
  memoryLimit: "512M"
#  smokeTest: 'nonProd'
  environment:
    DB_PASSWORD: "#{postgresPassword}"
    ENV: process.env.ENV
    ROLE_ID: process.env.ROLE_ID
    SECRET_ID: process.env.SECRET_ID
  route: 'experiments-api'
  startupCommand: 'npm start'
  services: [
    'experimentsDataSource',
    'expSys'
  ]
