module.exports = (cfDeploy) ->
  {postgresPassword} = cfDeploy.args

  deployable: '.'
  deployer: cfDeploy.deployers.awsDeployment
  diskLimit: "256M"
  instances: 2
  memoryLimit: "256M"
  environment:
    DB_PASSWORD: "#{postgresPassword}"
  route: 'experiments-api'
  startupCommand: 'npm start'
  services: [
    'experimentsDataSource', 'syslog'
  ]
