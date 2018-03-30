import { mock } from '../jestUtil'
import { notifyChanges } from '../../src/decorators/notifyChanges'
import KafkaProducer from '../../src/services/kafka/KafkaProducer'
import cfServices from '../../src/services/utility/ServiceConfig'

class testClass {
  @notifyChanges('create')
  static createFunc = method => method()

  @notifyChanges('update', 1)
  static updateFunc = (method, id) => method(id)
}

describe('notifyChanges', () => {
  describe('notifyChanges', () => {
    test('notify create', () => {
      const testMethod = () => Promise.resolve([{ id: 3 }])
      KafkaProducer.publish = mock()
      return testClass.createFunc(testMethod).then(() => {
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

    test('notify update', () => {
      const testMethod = id => Promise.resolve([{ id }])
      KafkaProducer.publish = mock()
      return testClass.updateFunc(testMethod, 2).then(() => {
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
