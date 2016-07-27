log4js = require 'log4js'

module.exports = () ->
  isRunningInCloudFoundry = () -> process.env.VCAP_APPLICATION
  if isRunningInCloudFoundry()
    vcapApplication = JSON.parse(process.env.VCAP_APPLICATION)
    config =
      "appenders" : [
        "type" : "console"
        "layout" :
          "type" : "pattern"
          "pattern" : "log_level=\"%p\"  app=\"%x{app}\" app_host=\"%x{host}\" instance=\"%x{instanceIndex}\" - %m%n"
          "tokens" :
            app : vcapApplication.application_name
            instanceIndex : process.env.CF_INSTANCE_INDEX
            deploymentEnvironment: process.env.DEPLOYMENT_ENV
            host: process.env.CF_INSTANCE_IP
      ]
    log4js.configure config,{}