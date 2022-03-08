const configurator = require('../src/config/configurator')

const EXP_QUEUE_ULR = 'https://sqs.us-east-1.amazonaws.com/286985534438/csw-experiment-backfill-test' // dev exp queue
const UNIT_QUEUE_ULR = 'https://sqs.us-east-1.amazonaws.com/286985534438/csw-experimental-units-test' // unit exp queue

const getExperimentIds = async (isTemplate) => {
  const { dbRead } = require('../src/db/DbManager')
  const experiments = await dbRead.experiments.all(isTemplate)
  return experiments.map(m => m.id)
}

const formatMessage = (id, timestamp) => ({
  resource_id: id,
  event_category: 'update',
  time: timestamp,
})

const backFillExperimentData = async () => {
  const experimentIds = await getExperimentIds(false)
  const timestamp = new Date(Date.now()).toISOString()
  console.info(`number of experiments: ${experimentIds.length}`, `timestamp: ${timestamp}`)
  const messages = experimentIds.map(id => formatMessage(id, timestamp))
  const chunk = require('lodash/chunk')
  const { batchSendSQSMessages } = require('../src/SQS/sqs')
  chunk(messages, 10).map(async (message) => {
    await batchSendSQSMessages(message, EXP_QUEUE_ULR)
    await batchSendSQSMessages(message, UNIT_QUEUE_ULR)
  })
}

configurator.init().then(() => {
  const config = require('../config')

  if (config.node_env !== 'production') {
    // eslint-disable-next-line
    require('@babel/register')
  }

  const vaultConfig = require('../src/config/vaultConfig').default
  const vaultUtil = require('../src/services/utility/VaultUtil')

  vaultUtil.configureDbCredentials(config.env, config.vaultRoleId, config.vaultSecretId,
    vaultConfig)
    .then(async () => {
      await backFillExperimentData()
    }).catch((err) => {
      console.error(err)
      config.exit()
    })
})
