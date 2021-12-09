import { ConsumerGroup } from 'kafka-node'
import VaultUtil from '../utility/VaultUtil'
import kafkaConfig from '../../config/kafkaConfig'
import { dbWrite } from '../../db/DbManager'

class SetEntriesChangesListener {
  listen() {
    const params = {
      client_id: VaultUtil.clientId,
      groupId: VaultUtil.clientId,
      kafkaHost: kafkaConfig.host,
      ssl: true,
      sslOptions: {
        cert: VaultUtil.kafkaClientCert,
        key: VaultUtil.kafkaPrivateKey,
        passphrase: VaultUtil.kafkaPassword,
        ca: VaultUtil.kafkaCA,
      },
    }

    const topics = [kafkaConfig.topics.setEntriesChangesTopic]
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
      await dbWrite.unit.batchClearEntryIds(entryIds)
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
