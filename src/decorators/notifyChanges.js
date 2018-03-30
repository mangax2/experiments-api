import _ from 'lodash'
import KafkaProducer from '../services/kafka/KafkaProducer'
import cfServices from '../services/utility/ServiceConfig'

function sendKafkaNotification(event, id) {
  const message =
    {
      resource_id: id,
      event_category: event,
      time: new Date(Date.now()).toISOString(),
    }

  KafkaProducer.publish(
    {
      topic: cfServices.experimentsKafka.value.topics.product360OutgoingTopic,
      message,
      schemaId: cfServices.experimentsKafka.value.schema.product360Outgoing,
    })
}

function addKafkaNotification(result, args, event, argIdx) {
  result.then((ids) => {
    const experimentIds = event === 'create' ? _.map(ids, 'id') : [parseInt(args[argIdx], 10)]
    _.forEach(experimentIds, id => sendKafkaNotification(event, id))
  })
}

function notifyChanges(event, argIdx) {
  return function (target, property, descriptor) {
    const wrappingFunction = (bindingFunction => function () {
      const result = bindingFunction(this, arguments)
      addKafkaNotification(result, arguments, event, argIdx)

      return result
    })

    if (descriptor.value) {
      // This section handles traditional javascript functions [function (arg) { //logic }]
      const wrappedFunction = descriptor.value
      const bindingFunction = (thisRef, args) => wrappedFunction.apply(thisRef, args)
      descriptor.value = wrappingFunction(bindingFunction)
    } else {
      // This section handles arrow functions [(arg) => { //logic }]
      const originalInitializer = descriptor.initializer
      descriptor.initializer = function () {
        const functionToWrap = originalInitializer.call(this)
        const bindingFunction = (thisRef, args) => functionToWrap(...args)
        return wrappingFunction(bindingFunction)
      }
    }

    return descriptor
  }
}

export { notifyChanges, sendKafkaNotification }
