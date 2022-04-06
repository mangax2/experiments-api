const AWS = require('aws-sdk')

const toMessage = (message, index) => ({
  Id: index.toString(),
  MessageBody: JSON.stringify(message),
})

// eslint-disable-next-line import/prefer-default-export
export const batchSendSQSMessages = async (messages, url) => {
  try {
    const params = {
      Entries: messages.map(toMessage),
      QueueUrl: url,
    }
    await new AWS.SQS().sendMessageBatch(params).promise()
    console.info('::: Success, event(s) sent to sqs count', messages.length)
  } catch (e) {
    console.error('::: Error sending event to sqs :::', e)
  }
}
