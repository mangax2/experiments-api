module.exports = (cfDeploy) ->
  {postgresPassword} = cfDeploy.args

  deployable: '.'
  deployer: cfDeploy.deployers.awsDeployment
  diskLimit: "256M"
  instances: 2
  memoryLimit: "256M"
  smokeTest: 'nonProd'
  environment:
    DB_PASSWORD: "#{postgresPassword}"
    ENV: process.env.ENV
  route: 'experiments-api'
  startupCommand: 'npm start'
  services: [
    'experimentsDataSource'
  ]
