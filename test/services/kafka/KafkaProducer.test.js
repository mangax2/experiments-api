import { Producer, KafkaClient } from 'kafka-node'
import { mock, mockResolve } from '../../jestUtil'
import KafkaProducer from '../../../src/services/kafka/KafkaProducer'
import VaultUtil from '../../../src/services/utility/VaultUtil'
import cfServices from '../../../src/services/utility/ServiceConfig'
import { serializeKafkaAvroMsg } from '../../../src/services/utility/AvroUtil'

jest.mock('kafka-node')

describe('KafkaProducer', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('createProducer', () => {
    test('creates a Kafka.Producer object', () => {
      const producer = { constructor() { return {} }, on: mock() }
      Producer.mockImplementation(() => producer)
      KafkaProducer.createProducer({})
      expect(KafkaProducer.producerPromise).not.toEqual(undefined)
    })
  })

  describe('init', () => {
    test('calls to create a new producer', () => {
      VaultUtil.kafkaClientCert = 'cert'
      VaultUtil.kafkaPrivateKey = 'key'
      VaultUtil.kafkaPassword = 'password'
      VaultUtil.clientId = 'PD-EXPERIMENTS-API-DEV-SVC'
      cfServices.experimentsKafka = { value: { host: 'host' } }
      const producer = { on: mock() }
      KafkaProducer.createProducer = mockResolve(producer)
      const kafkaClient = { constructor() { return {} } }
      KafkaClient.mockImplementation(() => kafkaClient)
      KafkaProducer.init()

      expect(KafkaProducer.createProducer).toHaveBeenCalledWith(kafkaClient)
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
        expect(producer.send.mock.calls[0][0]).toEqual([{ topic: 'topic', messages: '"message"' }])
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
        expect(producer.send.mock.calls[0][0]).toEqual([{ topic: 'topic', messages: '"message"' }])
      })
    })

    test('send an avro message', () => {
      const producer = {
        send: mock((message, cb) => cb(null)),
      }
      KafkaProducer.producerPromise = Promise.resolve(producer)
      KafkaProducer.init = jest.fn()

      const message = 'test'
      return KafkaProducer.publish({ topic: 'topic', message, schemaId: 1 }).then(() => {
        expect(KafkaProducer.init).not.toBeCalled()
        expect(producer.send.mock.calls[0][0]).toEqual([{ topic: 'topic', messages: serializeKafkaAvroMsg(message, 1) }])
      })
    })

    test('fails to send an avro message', () => {
      const producer = {
        send: mock((message, cb) => cb(new Error('error'))),
      }
      KafkaProducer.producerPromise = Promise.resolve(producer)
      KafkaProducer.init = jest.fn()

      const message = 'test'
      return KafkaProducer.publish({ topic: 'topic', message, schemaId: 1 }).then(null, (err) => {
        expect(KafkaProducer.init).not.toBeCalled()
        expect(producer.send.mock.calls[0][0]).toEqual([{ topic: 'topic', messages: serializeKafkaAvroMsg(message, 1) }])
        expect(err.message).toEqual('error')
      })
    })
  })
})
