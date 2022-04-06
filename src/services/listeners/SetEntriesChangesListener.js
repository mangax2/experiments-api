import { ConsumerGroup } from 'kafka-node'
import configurator from '../../configs/configurator'
import { dbWrite } from '../../db/DbManager'
import { batchSendUnitChangeNotification } from '../../SQS/sendUnitChangeNotification'

class SetEntriesChangesListener {
  listen() {
    const params = {
      client_id: configurator.get('client.clientId'),
      groupId: configurator.get('client.clientId'),
      kafkaHost: configurator.get('kafka.host'),
      ssl: true,
      sslOptions: {
        ...configurator.get('kafka.ssl'),
      },
    }

    const topics = [configurator.get('kafka.topics.setEntriesChangesTopic')]
    this.consumer = SetEntriesChangesListener.createConsumer(params, topics)

    // istanbul ignore next
    this.consumer.on('message', (message) => {
      this.dataHandler([message])
    })
  }

  // istanbul ignore next
  static createConsumer(params, topics) {
    return new ConsumerGroup(params, topics)
  }

  dataHandler = messageSet => Promise.all(messageSet.map(async (m) => {
    const message = m.value.toString('utf8')
    console.info(m.topic, m.partition, m.offset, message)

    const entryChanges = JSON.parse(message)
    const entryIds = entryChanges.reduce((entries, entryChange) => {
      if (entryChange.eventType === 'deleted') {
        entries = entries.concat(entryChange.entryIds || [])
      }
      return entries
    }, [])

    try {
      const results = await dbWrite.unit.batchClearEntryIds(entryIds)
      batchSendUnitChangeNotification((results || []).map(unit => unit.id), 'update')
    } catch (err) {
      console.error(`Failed to clear set entries to unit associations: ${entryIds}`, err)
    }
  }))
}

const setEntriesChangesListener = new SetEntriesChangesListener()
export default SetEntriesChangesListener
export {
  setEntriesChangesListener,
}
