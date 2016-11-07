/*eslint no-process-env: "warn"*/
/*eslint no-undef: "warn"*/
/*eslint no-console: "warn"*/

const log4js = require('log4js')

module.exports = () => {
    const logLevel = "DEBUG"
    console.log("12361283712983712983701982730981273098127039817209837120893701927309127390127309127309812730912830912739081270")
    const isRunningInCloudFoundry = () => { return process.env.VCAP_APPLICATION }
    if(isRunningInCloudFoundry){
        console.log("ALDFJALSDKJFALSDKJFSLADKJFASLKDFJSADLKFJSDLKFJSDALFJASD>KJFASLDKFJASDLKJFLSADKJFLASDKJFSADLJF")

        const vcapApplication = JSON.parse(process.env.VCAP_APPLICATION)
        const config = {
            appenders: [
                {
                    type: 'console',
                    layout: {
                        type: 'pattern',
                        pattern: 'log_level=\"%p\"  app=\"%x{app}\" app_host=\"%x{host}\" instance=\"%x{instanceIndex}\" - %m%n',
                        tokens: {
                            app : vcapApplication.application_name,
                            instanceIndex : process.env.CF_INSTANCE_INDEX,
                            deploymentEnvironment: process.env.DEPLOYMENT_ENV,
                            host: process.env.CF_INSTANCE_IP
                        }
                    }
                }
            ],
            levels:
                {
                    "[all]": logLevel
                }
        }

        return log4js.configure(config,{})
    }
}