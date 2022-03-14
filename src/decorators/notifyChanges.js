import _ from 'lodash'
import configurator from '../configs/configurator'
import KafkaProducer from '../services/kafka/KafkaProducer'

function sendKafkaNotification(event, id) {
  const message =
      {
        resource_id: id,
        event_category: event,
        time: new Date(Date.now()).toISOString(),
      }

  return KafkaProducer.publish(
    {
      topic: configurator.get('kafka.topics.product360OutgoingTopic'),
      message,
      schemaId: configurator.get('kafka.schema.product360Outgoing'),
    })
}

function addKafkaNotification(result, args, event, argIdx) {
  return result.then((ids) => {
    const experimentIds = event === 'create' ? _.map(ids, 'id') : [parseInt(args[argIdx], 10)]
    return Promise.all(_.map(experimentIds, id => sendKafkaNotification(event, id)))
      .catch(/* istanbul ignore next */(err) => { console.error(err) })
  })
}

function toSendKafkaNotify(event, args, sendArgIdx) {
  if (event === 'create' && args[sendArgIdx] === 'template') return false

  return args[sendArgIdx] !== true
}

function notifyChanges(event, argIdx, sendArgIdx) {
  return function (target, property, descriptor) {
    const wrappingFunction = (bindingFunction => function () {
      const result = bindingFunction(this, arguments)
      if (toSendKafkaNotify(event, arguments, sendArgIdx)) {
        return addKafkaNotification(result, arguments, event, argIdx)
          .then(() => result)
      }

      return result
    })

    if (configurator.get('kafka.enableKafka')) {
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
    }

    return descriptor
  }
}

export { notifyChanges, sendKafkaNotification }
