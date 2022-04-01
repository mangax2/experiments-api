import { batchSendSQSMessages } from '../../src/SQS/sqs'

const mockSQSInstance = {
  sendMessageBatch: jest.fn().mockReturnThis(),
  promise: jest.fn(),
}

jest.mock('aws-sdk', () => ({
  SQS: jest.fn(() => mockSQSInstance),
}))

describe('sqs', () => {
  describe('batchSendSQSMessages', () => {
    test('SQS messages should contain a url and string messages', async () => {
      const time = new Date(Date.now()).toISOString()
      const messages = [{ id: 123, event_category: 'create', time }]
      const testQueueUrl = 'queueUrl'
      await batchSendSQSMessages(messages, testQueueUrl)
      expect(mockSQSInstance.sendMessageBatch).toHaveBeenCalledWith({
        Entries: messages.map((message, index) => ({
          Id: index.toString(),
          MessageBody: JSON.stringify(message),
        })),
        QueueUrl: testQueueUrl,
      })
      expect(console.info).toHaveBeenCalledWith('::: Success, event(s) sent to sqs count', 1)
    })
  })
  test('should fail if sendMessages fails', async () => {
    mockSQSInstance.promise.mockImplementation(() => throw 'error')
    const messages = [{ id: 123 }]
    const testQueueUrl = 'queueUrl'
    await batchSendSQSMessages(messages, testQueueUrl)
    expect(mockSQSInstance.sendMessageBatch).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith('::: Error sending event to sqs :::', 'error')
    mockSQSInstance.promise.mockRestore()
  })
})
