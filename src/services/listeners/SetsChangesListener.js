import { ConsumerGroup } from 'kafka-node'
import avro from 'avsc'
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import VaultUtil from '../utility/VaultUtil'
import kafkaConfig from '../../config/kafkaConfig'
import { dbWrite } from '../../db/DbManager'
import { sendKafkaNotification } from '../../decorators/notifyChanges'

class SetsChangesListener {
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
      encoding: 'buffer',
    }

    const topics = [kafkaConfig.topics.setsChangesTopic]
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
    const message = m.value

    console.info(m.topic, m.partition, m.offset)
    const type = avro.Type.forSchema({
      type: 'record',
      fields: [
        { name: 'resource_id', type: 'int' },
        { name: 'event_category', type: 'string' },
        { name: 'time', type: 'string' },
      ],
    })
    // TODO: Pull this out into the AvroUtil so that it can be properly mocked the next
    // time we consume an AVRO topic. As it is, our unit tests for this currently rely on
    // the AvroUtil class to even test this function.
    const data = type.fromBuffer(message.slice(5))
    const eventCategory = data.event_category

    if (eventCategory === 'delete') {
      const setId = data.resource_id
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
