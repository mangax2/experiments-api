const config = require('../../../config')
const VaultUtil = require('./VaultUtil')

let cfServices
let services

const automationSpecEnv = config.node_env !== 'production' && config.env === 'np'
const testEnv = config.node_env === 'test' || config.node_env === 'UNITTEST'
const localEnv = config.env !== 'prod' && config.env !== 'np' && config.env !== 'dev'
// disabled eslint's are because we want to conditionally load files
if (localEnv || testEnv) {
  console.info('environment is local')
  //eslint-disable-next-line
  cfServices = require('./localEnvConfig')
} else if (automationSpecEnv) {
  console.info('environment is aws nonprod')
  //eslint-disable-next-line
  cfServices = require('./automationTestDBConfig')
} else {
  console.info('environment is aws cf')
  //eslint-disable-next-line
  services = require('@monsantoit/cloud-foundry').services
  services.experimentsDataSource.user = VaultUtil.dbAppUser
  services.experimentsDataSource.password = VaultUtil.dbAppPassword
  services.experimentsDataSource.ssl = true
  services.pingDataSource = {
    url: services.experimentsExternalAPIUrls.value.pingAPIUrl,
    clientId: VaultUtil.clientId,
    clientSecret: VaultUtil.clientSecret,
  }
  cfServices = services
}

module.exports = cfServices
