const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'saml' })

const sqs = new AWS.SQS()

export const sendSQSMessage = async (message, url) => {
  try {
    const params = {
      MessageBody: JSON.stringify(message),
      QueueUrl: url,
    }
    const data = await sqs.sendMessage(params).promise()
    console.info('::: Success, event send to sqs :::', data.MessageId)
  } catch (e) {
    console.error('::: Error sending event to sqs :::', e)
  }
}

const toMessage = (message, index) => ({
  Id: index.toString(),
  MessageBody: JSON.stringify(message),
})

export const batchSendSQSMessages = async (messages, url) => {
  try {
    const params = {
      Entries: messages.map(toMessage),
      QueueUrl: url,
    }
    await sqs.sendMessageBatch(params).promise()
    console.info('::: Success, event send to sqs count', messages.length)
  } catch (e) {
    console.error('::: Error sending event to sqs :::', e)
  }
}
