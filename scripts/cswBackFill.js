const configurator = require('../src/config/configurator')

const QUEUE_ULR = 'https://sqs.us-east-1.amazonaws.com/286985534438/Exp-CSW-backfill-test' // dev queue

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
  const [experimentIds, templateIds] = await Promise.all(
    [getExperimentIds(true),
      getExperimentIds(false)],
  )
  const ids = experimentIds.concat(templateIds)
  const timestamp = new Date(Date.now()).toISOString()
  const messages = ids.map(id => formatMessage(id, timestamp))
  const chunk = require('lodash/chunk')
  chunk(messages, 10).map(async (m) => {
    const { batchSendSQSMessages } = require('../src/SQS/sqs')
    await batchSendSQSMessages(m, QUEUE_ULR)
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
