import { ConsumerGroup } from 'kafka-node'
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import configurator from '../../configs/configurator'
import { dbWrite } from '../../db/DbManager'
import { sendKafkaNotification } from '../../decorators/notifyChanges'

class SetsChangesListener {
  listen() {
    const params = {
      client_id: configurator.get('client.clientId'),
      groupId: configurator.get('client.clientId'),
      kafkaHost: configurator.get('kafka.host'),
      ssl: true,
      sslOptions: {
        ...configurator.get('kafka.ssl'),
      },
      encoding: 'buffer',
    }

    const topics = [configurator.get('kafka.topics.setsChangesTopic')]
    this.consumer = SetsChangesListener.createConsumer(params, topics)

    // cannot test this event
    // istanbul ignore next
    this.consumer.on('message', (message) => {
      this.dataHandler([message])
    })
  }

  // istanbul ignore next
  static createConsumer(params, topics) {
    return new ConsumerGroup(params, topics)
  }

  dataHandler = messageSet => Promise.all(_.map(messageSet, (m) => {
    const message = m.value.toString('utf8')
    console.info(m.topic, m.partition, m.offset, message)

    const setChange = JSON.parse(message)
    if (setChange.actionType === 'D') {
      const setId = setChange.id
      return this.clearSet(setId).then((setClearResults) => {
        if (!_.isNil(setClearResults)) {
          console.info(`Successfully cleared SetId: ${setId} and related set entry ids`)
          sendKafkaNotification('update', setClearResults.experiment_id)
        }
      }).catch((err) => {
        console.error(`Failed to clear setId: ${setId}`, err)
        return Promise.reject(err)
      })
    }

    return Promise.resolve()
  }))

  @Transactional('ManageSetsChange')
  clearSet = (setId, tx) => dbWrite.unit.batchClearEntryIdsBySetId(setId, tx)
    .then(() => dbWrite.locationAssociation.removeBySetId(setId, tx))
}

const setsChangesListener = new SetsChangesListener()
export default SetsChangesListener
export {
  setsChangesListener,
}
