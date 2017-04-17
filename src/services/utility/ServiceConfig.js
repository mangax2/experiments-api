import config from '../../../config'
import VaultUtil from './VaultUtil'

let cfServices
let services

const automationSpecEnv = config.node_env !== 'production' && config.env === 'nonprod'
const localEnv = config.env !== 'prod' && config.env !== 'nonprod'
// disabled eslint's are because we want to conditionally load files
if (localEnv) {
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
  cfServices = services
}

module.exports = cfServices
