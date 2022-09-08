import kafkaConfig from '../../configs/kafkaConfig'
import { dbWrite } from '../../../src/db/DbManager'
import { mock, mockResolve, mockReject } from '../../jestUtil'
import { sendKafkaNotification } from '../../../src/decorators/notifyChanges'

jest.mock('kafka-node')
jest.mock('../../../src/decorators/notifyChanges')

const SetsChangesListener = require('../../../src/services/listeners/SetsChangesListener').default

describe('SetsChangesListener', () => {
  beforeEach(() => {
    sendKafkaNotification.mockClear()
  })

  describe('using mocked kafka-node', () => {
    describe('listen', () => {
      test('calls things correctly', () => {
        const target = new SetsChangesListener()
        kafkaConfig.host = 'host'
        kafkaConfig.topics = { setsChangesTopic: 'topic' }
        const consumer = { on: jest.fn() }
        SetsChangesListener.createConsumer = jest.fn(() => consumer)
        target.dataHandler = mock()

        target.listen()

        expect(target.consumer).toBe(consumer)
        expect(SetsChangesListener.createConsumer).toBeCalledWith({
          client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
          encoding: 'buffer',
          groupId: 'PD-EXPERIMENTS-API-DEV-SVC',
          kafkaHost: 'host',
          ssl: true,
          sslOptions: {
            cert: 'cert',
            key: 'key',
            passphrase: 'password',
            ca: 'ca',
          },
        }, ['topic'])
      })
    })

    describe('dataHandler', () => {
      kafkaConfig.topics = { product360OutgoingTopic: 'outgoingTopic' }
      kafkaConfig.schema = { product360Outgoing: 'outgoing' }

      test('calls clearSet', () => {
        const message = {
          id: 123,
          actionType: 'D',
        }

        const target = new SetsChangesListener()
        target.clearSet = mockResolve([])
        target.consumer = {}

        return target.dataHandler([{ value: JSON.stringify(message), offset: 1 }], 'topic', 'partition').then(() => {
          expect(target.clearSet).toHaveBeenCalledWith(123)
        })
      })

      test('calls clearSet that returns data', () => {
        const message = {
          id: 123,
          actionType: 'D',
        }

        const target = new SetsChangesListener()
        target.clearSet = mockResolve([{ experiment_id: 1 }])
        target.consumer = {}
        kafkaConfig.topics = { product360OutgoingTopic: 'topic1' }
        kafkaConfig.schema = { product360Outgoing: 123 }

        return target.dataHandler([{ value: JSON.stringify(message), offset: 1 }], 'topic', 'partition').then(() => {
          expect(target.clearSet).toHaveBeenCalledWith(123)
        })
      })

      test('calls clearSet that has no return data', () => {
        const message = {
          id: 123,
          actionType: 'D',
        }

        const target = new SetsChangesListener()
        target.clearSet = mockResolve(null)
        target.consumer = {}
        kafkaConfig.topics = { product360OutgoingTopic: 'topic1' }
        kafkaConfig.schema = { product360Outgoing: 123 }

        return target.dataHandler([{ value: JSON.stringify(message), offset: 1 }], 'topic', 'partition').then(() => {
          expect(target.clearSet).toHaveBeenCalledWith(123)
          expect(sendKafkaNotification).not.toHaveBeenCalled()
        })
      })

      test('fails to clear set', () => {
        const message = {
          id: 123,
          actionType: 'D',
        }

        const target = new SetsChangesListener()
        target.clearSet = mockReject(new Error('error'))
        target.consumer = {}
        kafkaConfig.topics = { product360OutgoingTopic: 'topic1' }
        kafkaConfig.schema = { product360Outgoing: 123 }

        return target.dataHandler([{ value: JSON.stringify(message), offset: 1 }], 'topic', 'partition').then(null, (err) => {
          expect(target.clearSet).toHaveBeenCalledWith(123)
          expect(err.message).toEqual('error')
        })
      })

      test('calls nothing if event is not delete', () => {
        const message = {
          id: 123,
          actionType: 'U',
        }

        const target = new SetsChangesListener()
        target.clearSet = mock()
        target.consumer = {}

        return target.dataHandler([{ value: JSON.stringify(message), offset: 1 }], 'topic', 'partition').then(() => {
          expect(target.clearSet).not.toHaveBeenCalled()
        })
      })
    })

    describe('clearSet', () => {
      const testTx = { tx: {} }
      test('calls clearSetEntryIds and clearSetId', () => {
        dbWrite.unit.batchClearEntryIdsBySetId = mockResolve()
        dbWrite.locationAssociation.removeBySetId = mockResolve()

        const target = new SetsChangesListener()
        return target.clearSet(1, testTx).then(() => {
          expect(dbWrite.unit.batchClearEntryIdsBySetId).toHaveBeenCalledWith(1, testTx)
          expect(dbWrite.locationAssociation.removeBySetId).toHaveBeenCalledWith(1, testTx)
        })
      })
    })
  })
})
