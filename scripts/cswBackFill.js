const debounce = require('lodash/debounce')
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

const asyncDebounce = (func, wait) => {
  const debounced = debounce(async (resolve, reject, args) => {
    const result = await func(...args)
    resolve(result)
  }, wait)
  return (...args) =>
    new Promise((resolve, reject) => {
      debounced(resolve, reject, args)
    })
}

// eslint-disable-next-line
require('@babel/register')
const debouncedBatchSendSQSMessages = asyncDebounce(require('../src/SQS/sqs').batchSendSQSMessages, 60000)

const backFillExperimentData = async () => {
  const [experimentIds, templateIds] =
    await Promise.all(
      [getExperimentIds(false),
        getExperimentIds(true)],
    )
  const ids = experimentIds.concat(templateIds)
  console.info(`number of experiments: ${ids.length}`)
  const timestamp = new Date(Date.now()).toISOString()
  const messages = ids.map(id => formatMessage(id, timestamp))
  const promise = require('bluebird')
  const chunk = require('lodash/chunk')
  promise.each(chunk(messages, 5), async (message) => {
    await debouncedBatchSendSQSMessages(message, QUEUE_ULR)
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
