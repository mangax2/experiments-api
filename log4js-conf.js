const log4js = require('log4js')

module.exports = () => {
  const logLevel = 'INFO'
  const isRunningInCloudFoundry = () => process.env.VCAP_APPLICATION
  if (isRunningInCloudFoundry()) {
    const vcapApplication = JSON.parse(process.env.VCAP_APPLICATION)
    const config = {
      appenders: [
        {
          type: 'console',
          layout: {
            type: 'pattern',
            pattern: 'log_level="%p"  app="%x{app}" app_host="%x{host}" instance="%x{instanceIndex}" - %m%n',
            tokens: {
              app: vcapApplication.application_name.includes('-temp') ? vcapApplication.application_name.substring(0, vcapApplication.application_name.length - 5) : vcapApplication.application_name,
              instanceIndex: process.env.CF_INSTANCE_INDEX,
              deploymentEnvironment: process.env.DEPLOYMENT_ENV,
              host: process.env.CF_INSTANCE_IP,
            },
          },
        },
      ],
      levels: {
        '[all]': logLevel,
      },
    }

    return log4js.configure(config, {})
  }

  const config = {
    appenders: [
      {
        type: 'console',
      },
    ],
    levels: {
      '[all]': logLevel,
    },
  }

  return log4js.configure(config, {})
}
