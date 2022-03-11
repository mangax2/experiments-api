import chunk from 'lodash/chunk'
import { sendSQSMessage, batchSendSQSMessages } from './sqs'

// TODO this is only for local, once @monsantoit/config change is done, put this in vault
const UNIT_QUEUE_ULR = 'https://sqs.us-east-1.amazonaws.com/286985534438/csw-experimental-units-test'

const formatMessage = (id, eventCategory, timestamp) => ({
  resource_id: id,
  event_category: eventCategory,
  time: timestamp,
})

export const sendUnitChangeNotification = (id, eventCategory) => {
  const timestamp = new Date(Date.now()).toISOString()
  const message = formatMessage(id, eventCategory, timestamp)
  sendSQSMessage(message, UNIT_QUEUE_ULR).catch((error) => {
    console.error(`Failed to send SQS unit update message, unit id: ${id}, timestamp: ${timestamp}`, error)
  })
}

export const batchSendUnitChangeNotification = (ids, eventCategory) => {
  const timestamp = new Date(Date.now()).toISOString()
  const messages = ids.map(id => formatMessage(id, eventCategory, timestamp))
  chunk(messages, 10).map(async (message) => {
    await batchSendSQSMessages(message, UNIT_QUEUE_ULR)
  })
}
