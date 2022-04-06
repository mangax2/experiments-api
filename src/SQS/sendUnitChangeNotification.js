import chunk from 'lodash/chunk'
import { batchSendSQSMessages } from './sqs'
import configurator from '../configs/configurator'

const formatMessage = (id, eventCategory, timestamp) => ({
  resource_id: id,
  event_category: eventCategory,
  time: timestamp,
})

// eslint-disable-next-line import/prefer-default-export
export const batchSendUnitChangeNotification = (ids, eventCategory) => {
  if (!ids) return

  const timestamp = new Date(Date.now()).toISOString()
  const messages = ids.map(id => formatMessage(id, eventCategory, timestamp))
  chunk(messages, 10).map(async (message) => {
    const queueUrl = configurator.get('SQS.unitUrl')
    await batchSendSQSMessages(message, queueUrl)
  })
}
