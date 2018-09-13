import Kafka from 'no-kafka'
import VaultUtil from '../../../src/services/utility/VaultUtil'
import cfServices from '../../../src/services/utility/ServiceConfig'
import db from '../../../src/db/DbManager'
import {
  kafkaProducerMocker, mock, mockResolve, mockReject,
} from '../../jestUtil'
import SetsChangesListener from '../../../src/services/listeners/SetsChangesListener'
import { serializeKafkaAvroMsg } from '../../../src/services/utility/AvroUtil'

describe('SetsChangesListener', () => {
  kafkaProducerMocker()

  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('createConsumer', () => {
    test('creates an object of type Kafka.GroupConsumer', () => {
      expect(SetsChangesListener.createConsumer() instanceof Kafka.GroupConsumer).toBe(true)
    })
  })

  describe('listen', () => {
    test('calls things correctly', () => {
      const target = new SetsChangesListener()
      VaultUtil.kafkaClientCert = 'cert'
      VaultUtil.kafkaPrivateKey = 'key'
      VaultUtil.kafkaPassword = 'password'
      VaultUtil.clientId = 'PD-EXPERIMENTS-API-DEV-SVC'
      cfServices.experimentsKafka = { value: { host: 'host', topics: { setsChangesTopic: 'topic' } } }
      const consumer = { init: jest.fn() }
      SetsChangesListener.createConsumer = jest.fn(() => consumer)

      target.listen()

      expect(consumer.init).toBeCalledWith([{ subscriptions: ['topic'], handler: target.dataHandler }])
      expect(target.consumer).toBe(consumer)
      expect(SetsChangesListener.createConsumer).toBeCalledWith({
        client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
        groupId: 'PD-EXPERIMENTS-API-DEV-SVC',
        connectionString: 'host',
        reconnectionDelay: { min: 100000, max: 100000 },
        ssl: {
          cert: 'cert',
          key: 'key',
          passphrase: 'password',
        },
      })
    })
  })

  describe('dataHandler', () => {
    test('converts data from avro to json and calls clearSet', () => {
      const message = {
        resource_id: 123,
        event_category: 'delete',
        time: '123',
      }

      const serializedMessage = serializeKafkaAvroMsg(message, 777)

      const target = new SetsChangesListener()
      target.clearSet = mockResolve([])
      target.consumer = { commitOffset: mock() }

      return target.dataHandler([{ message: { value: serializedMessage }, offset: 1 }], 'topic', 'partition').then(() => {
        expect(target.clearSet).toHaveBeenCalledWith(123)
      })
    })

    test('converts data from avro to json and calls clearSet that returns data', () => {
      const message = {
        resource_id: 123,
        event_category: 'delete',
        time: '123',
      }

      const serializedMessage = serializeKafkaAvroMsg(message, 777)

      const target = new SetsChangesListener()
      target.clearSet = mockResolve([{ experiment_id: 1 }])
      target.consumer = { commitOffset: mock() }
      cfServices.experimentsKafka = { value: { topics: { product360OutgoingTopic: 'topic1' }, schema: { product360Outgoing: 123 } } }

      return target.dataHandler([{ message: { value: serializedMessage }, offset: 1 }], 'topic', 'partition').then(() => {
        expect(target.clearSet).toHaveBeenCalledWith(123)
        expect(target.consumer.commitOffset).toHaveBeenCalled()
      })
    })

    test('does not call commitOffset on failure', () => {
      const message = {
        resource_id: 123,
        event_category: 'delete',
        time: '123',
      }

      const serializedMessage = serializeKafkaAvroMsg(message, 777)

      const target = new SetsChangesListener()
      target.clearSet = mockReject()
      target.consumer = { commitOffset: mock() }

      return target.dataHandler([{ message: { value: serializedMessage }, offset: 1 }], 'topic', 'partition').then(() => {}, () => {
        expect(target.clearSet).toHaveBeenCalled()
        expect(target.consumer.commitOffset).not.toHaveBeenCalled()
      })
    })

    test('calls nothing if event is not delete', () => {
      const message = {
        resource_id: 123,
        event_category: 'update',
        time: '123',
      }

      const serializedMessage = serializeKafkaAvroMsg(message, 777)

      const target = new SetsChangesListener()
      target.clearSet = mock()
      target.consumer = { commitOffset: mock() }

      return target.dataHandler([{ message: { value: serializedMessage }, offset: 1 }], 'topic', 'partition').then(() => {
        expect(target.clearSet).not.toHaveBeenCalled()
        expect(target.consumer.commitOffset).not.toHaveBeenCalled()
      })
    })
  })

  describe('clearSet', () => {
    const testTx = { tx: {} }
    test('calls clearSetEntryIds and clearSetId', () => {
      db.unit.batchClearEntryIds = mockResolve()
      db.locationAssociation.removeBySetId = mockResolve()

      const target = new SetsChangesListener()
      return target.clearSet(1, testTx).then(() => {
        expect(db.unit.batchClearEntryIds).toHaveBeenCalledWith(1, testTx)
        expect(db.locationAssociation.removeBySetId).toHaveBeenCalledWith(1, testTx)
      })
    })
  })
})
