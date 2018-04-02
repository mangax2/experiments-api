import { mock } from '../jestUtil'
import { notifyChanges } from '../../src/decorators/notifyChanges'
import KafkaProducer from '../../src/services/kafka/KafkaProducer'
import cfServices from '../../src/services/utility/ServiceConfig'

class testClass {
  @notifyChanges('create')
  static createFunc = () => Promise.resolve([{ id: 3 }])

  @notifyChanges('create', 0)
  static create() {
    return Promise.resolve([{ id: 3 }])
  }

  @notifyChanges('update', 0)
  static update(id) {
    return Promise.resolve([{ id }])
  }

  @notifyChanges('update', 0, 1)
  static updateFunc = (id, isTemplate) => {
    if (isTemplate) {
      return Promise.resolve()
    }

    return Promise.resolve([{ id }])
  }
}

describe('notifyChanges', () => {
  describe('notifyChanges', () => {
    test('notify create arrow function', () => {
      KafkaProducer.publish = mock()
      return testClass.createFunc().then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: cfServices.experimentsKafka.value.topics.product360OutgoingTopic,
          message: {
            resource_id: 3,
            event_category: 'create',
            time: expect.any(String),
          },
          schemaId: cfServices.experimentsKafka.value.schema.product360Outgoing,
        })
      })
    })

    test('notify create function', () => {
      KafkaProducer.publish = mock()
      return testClass.create().then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: cfServices.experimentsKafka.value.topics.product360OutgoingTopic,
          message: {
            resource_id: 3,
            event_category: 'create',
            time: expect.any(String),
          },
          schemaId: cfServices.experimentsKafka.value.schema.product360Outgoing,
        })
      })
    })

    test('notify update arrow function', () => {
      KafkaProducer.publish = mock()
      return testClass.updateFunc(2).then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: cfServices.experimentsKafka.value.topics.product360OutgoingTopic,
          message: {
            resource_id: 2,
            event_category: 'update',
            time: expect.any(String),
          },
          schemaId: cfServices.experimentsKafka.value.schema.product360Outgoing,
        })
      })
    })

    test('notify update function', () => {
      KafkaProducer.publish = mock()
      return testClass.update(2).then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: cfServices.experimentsKafka.value.topics.product360OutgoingTopic,
          message: {
            resource_id: 2,
            event_category: 'update',
            time: expect.any(String),
          },
          schemaId: cfServices.experimentsKafka.value.schema.product360Outgoing,
        })
      })
    })

    test('notify update template', () => {
      KafkaProducer.publish = mock()
      return testClass.updateFunc(2, true).then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(0)
      })
    })

    test('notify update with send parameter set', () => {
      KafkaProducer.publish = mock()
      return testClass.updateFunc(2, false).then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: cfServices.experimentsKafka.value.topics.product360OutgoingTopic,
          message: {
            resource_id: 2,
            event_category: 'update',
            time: expect.any(String),
          },
          schemaId: cfServices.experimentsKafka.value.schema.product360Outgoing,
        })
      })
    })
  })
})
