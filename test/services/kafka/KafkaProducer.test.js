import KafkaProducer from '../../../src/services/kafka/KafkaProducer'
import Kafka from 'no-kafka'
import VaultUtil from '../../../src/services/utility/VaultUtil'
import cfServices from '../../../src/services/utility/ServiceConfig'
import { serializeKafkaAvroMsg } from '../../../src/services/utility/AvroUtil'

describe('KafkaProducer', () => {
  describe('createProducer', () => {
    test('creates a Kafka.Producer object', () => {
      expect(KafkaProducer.createProducer() instanceof Kafka.Producer).toBe(true)
    })
  })

  describe('init', () => {
    test('calls things correctly', () => {
      VaultUtil.kafkaClientCert = 'cert'
      VaultUtil.kafkaPrivateKey = 'key'
      VaultUtil.kafkaPassword = 'password'
      VaultUtil.clientId = 'PD-EXPERIMENTS-API-DEV-SVC'
      cfServices.experimentsKafka = { value: { host: 'host' } }
      const producer = { init: jest.fn(() => Promise.resolve()) }
      KafkaProducer.createProducer = jest.fn(() => producer)

      KafkaProducer.init()

      expect(producer.init).toBeCalled()
      return (KafkaProducer.producerPromise).then((result) => {
        expect(result).toBe(producer)

        expect(KafkaProducer.createProducer).toBeCalledWith({
          client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
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
  })

  describe('publish', () => {
    test('calls init if KafkaProducer is not initialized', () => {
      KafkaProducer.producerPromise = undefined
      const producer = {
        send: jest.fn(),
      }
      KafkaProducer.init = jest.fn(() => { KafkaProducer.producerPromise = Promise.resolve(producer) })

      return KafkaProducer.publish({ topic: 'topic', message: 'message' }).then(() => {
        expect(KafkaProducer.init).toBeCalled()
        expect(producer.send).toBeCalledWith({ topic: 'topic', message: { value: '"message"' } }, {})
      })
    })

    test('does not call init if KafkaProducer is initialized', () => {
      const producer = {
        send: jest.fn(),
      }
      KafkaProducer.producerPromise = Promise.resolve(producer)
      KafkaProducer.init = jest.fn()

      return KafkaProducer.publish({ topic: 'topic', message: 'message' }).then(() => {
        expect(KafkaProducer.init).not.toBeCalled()
        expect(producer.send).toBeCalledWith({ topic: 'topic', message: { value: '"message"' } }, {})
      })
    })

    test('send an avro message', () => {
      const producer = {
        send: jest.fn(),
      }
      KafkaProducer.producerPromise = Promise.resolve(producer)
      KafkaProducer.init = jest.fn()

      const message = 'test'
      return KafkaProducer.publish({ topic: 'topic', message, schemaId: 1 }).then(() => {
        expect(KafkaProducer.init).not.toBeCalled()
        expect(producer.send).toBeCalledWith({ topic: 'topic', message: { value: serializeKafkaAvroMsg(message, 1) } }, {})
      })
    })
  })
})
