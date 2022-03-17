import { mock } from '../jestUtil'
import kafkaConfig from '../configs/kafkaConfig'
import KafkaProducer from '../../src/services/kafka/KafkaProducer'

kafkaConfig.enableKafka = 'true'

const { notifyChanges } = require('../../src/decorators/notifyChanges')

class testClass {
  @notifyChanges('create', null, 1)
  static createFunc = (id, typeString) => {
    if (typeString === 'template') {
      return Promise.resolve()
    }

    return Promise.resolve([{ id }])
  }

  @notifyChanges('create', null, 0)
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
  afterAll(() => {
    kafkaConfig.enableKafka = 'false'
  })

  describe('notifyChanges', () => {
    test('notify create experiment arrow function', () => {
      KafkaProducer.publish = mock()
      return testClass.createFunc(3).then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: kafkaConfig.topics.product360OutgoingTopic,
          message: {
            resource_id: 3,
            event_category: 'create',
            time: expect.any(String),
          },
          schemaId: kafkaConfig.schema.product360Outgoing,
        })
      })
    })

    test('notify create template', () => {
      KafkaProducer.publish = mock()
      return testClass.createFunc(3, 'template').then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(0)
      })
    })

    test('notify create experiment', () => {
      KafkaProducer.publish = mock()
      return testClass.createFunc(1, 'experiment').then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: kafkaConfig.topics.product360OutgoingTopic,
          message: {
            resource_id: 1,
            event_category: 'create',
            time: expect.any(String),
          },
          schemaId: kafkaConfig.schema.product360Outgoing,
        })
      })
    })

    test('notify create function', () => {
      KafkaProducer.publish = mock()
      return testClass.create().then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: kafkaConfig.topics.product360OutgoingTopic,
          message: {
            resource_id: 3,
            event_category: 'create',
            time: expect.any(String),
          },
          schemaId: kafkaConfig.schema.product360Outgoing,
        })
      })
    })

    test('notify update arrow function', () => {
      KafkaProducer.publish = mock()
      return testClass.updateFunc(2).then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: kafkaConfig.topics.product360OutgoingTopic,
          message: {
            resource_id: 2,
            event_category: 'update',
            time: expect.any(String),
          },
          schemaId: kafkaConfig.schema.product360Outgoing,
        })
      })
    })

    test('notify update function', () => {
      KafkaProducer.publish = mock()
      return testClass.update(2).then(() => {
        expect(KafkaProducer.publish).toHaveBeenCalledTimes(1)
        expect(KafkaProducer.publish).toHaveBeenCalledWith({
          topic: kafkaConfig.topics.product360OutgoingTopic,
          message: {
            resource_id: 2,
            event_category: 'update',
            time: expect.any(String),
          },
          schemaId: kafkaConfig.schema.product360Outgoing,
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
          topic: kafkaConfig.topics.product360OutgoingTopic,
          message: {
            resource_id: 2,
            event_category: 'update',
            time: expect.any(String),
          },
          schemaId: kafkaConfig.schema.product360Outgoing,
        })
      })
    })
  })
})
