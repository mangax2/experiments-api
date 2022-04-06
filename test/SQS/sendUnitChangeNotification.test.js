import { batchSendUnitChangeNotification } from '../../src/SQS/sendUnitChangeNotification'
import { batchSendSQSMessages } from '../../src/SQS/sqs'

jest.mock('../../src/SQS/sqs', () => ({
  batchSendSQSMessages: jest.fn(),
}))

describe('sendUnitChangeNotification', () => {
  describe('batchSendUnitChangeNotification', () => {
    test('should chunk the messages and call batchSendSQSMessages', () => {
      const ids = Array(15).fill().map((_, index) => index)
      batchSendUnitChangeNotification(ids, 'create')
      expect(batchSendSQSMessages).toHaveBeenCalledTimes(2)
      const messages = ids.map(id => ({
        resource_id: id,
        event_category: 'create',
        time: expect.anything(),
      }))
      expect(batchSendSQSMessages).toHaveBeenCalledWith(messages.slice(0, 10), 'test-unit-queue')
      expect(batchSendSQSMessages).toHaveBeenCalledWith(messages.slice(10, 15), 'test-unit-queue')
    })
  })
})
