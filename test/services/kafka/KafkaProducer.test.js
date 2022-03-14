import { mock } from '../../jestUtil'
import kafkaConfig from '../../configs/kafkaConfig'
import AvroUtil from '../../../src/services/utility/AvroUtil'

jest.mock('kafka-node')

const { KafkaClient } = require('kafka-node')
const KafkaProducer = require('../../../src/services/kafka/KafkaProducer').default

describe('KafkaProducer', () => {
  describe('init', () => {
    test('calls to create a new producer', () => {
      kafkaConfig.host = 'host'
      KafkaProducer.createProducer = mock()
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
      const encodedMessage = 'encodedMessage'
      AvroUtil.serializeKafkaAvroMsg = mock(encodedMessage)

      const message = 'test'
      return KafkaProducer.publish({ topic: 'topic', message, schemaId: 1 }).then(() => {
        expect(KafkaProducer.init).not.toBeCalled()
        expect(producer.send.mock.calls[0][0]).toEqual([{ topic: 'topic', messages: encodedMessage }])
        expect(AvroUtil.serializeKafkaAvroMsg).toHaveBeenCalledWith(message, 1, undefined)
      })
    })

    test('sends an avro message with a schema', () => {
      const producer = {
        send: mock((message, cb) => cb(null)),
      }
      KafkaProducer.producerPromise = Promise.resolve(producer)
      KafkaProducer.init = jest.fn()
      const encodedMessage = 'encodedMessage'
      AvroUtil.serializeKafkaAvroMsg = mock(encodedMessage)

      const message = { field: 'test' }
      const schema = { type: 'record', fields: [{ name: 'field', type: 'string' }] }

      return KafkaProducer.publish({
        topic: 'topic', message, schemaId: 1, schema,
      }).then(() => {
        expect(KafkaProducer.init).not.toBeCalled()
        expect(producer.send.mock.calls[0][0]).toEqual([{ topic: 'topic', messages: encodedMessage }])
        expect(AvroUtil.serializeKafkaAvroMsg).toHaveBeenCalledWith(message, 1, schema)
      })
    })

    test('fails to send an avro message', () => {
      const producer = {
        send: mock((message, cb) => cb(new Error('error'))),
      }
      KafkaProducer.producerPromise = Promise.resolve(producer)
      KafkaProducer.init = jest.fn()
      const encodedMessage = 'encodedMessage'
      AvroUtil.serializeKafkaAvroMsg = mock(encodedMessage)

      const message = 'test'
      return KafkaProducer.publish({ topic: 'topic', message, schemaId: 1 }).then(null, (err) => {
        expect(KafkaProducer.init).not.toBeCalled()
        expect(producer.send.mock.calls[0][0]).toEqual([{ topic: 'topic', messages: encodedMessage }])
        expect(err.message).toEqual('error')
      })
    })
  })
})
