import Kafka from 'no-kafka'
import log4js from 'log4js'
import avro from 'avsc'
import _ from 'lodash'
import VaultUtil from '../utility/VaultUtil'
import cfServices from '../utility/ServiceConfig'
import db from '../../db/DbManager'
import Transactional from '../../decorators/transactional'
import { sendKafkaNotification } from '../../decorators/notifyChanges'

const logger = log4js.getLogger('SetsChangesListener')

class SetsChangesListener {
  listen() {
    const params = {
      client_id: VaultUtil.clientId,
      groupId: VaultUtil.clientId,
      connectionString: cfServices.experimentsKafka.value.host,
      reconnectionDelay: {
        min: 100000,
        max: 100000,
      },
      ssl: {
        cert: VaultUtil.kafkaClientCert,
        key: VaultUtil.kafkaPrivateKey,
        passphrase: VaultUtil.kafkaPassword,
      },
    }

    this.consumer = SetsChangesListener.createConsumer(params)
    const strategies = [{
      subscriptions: [cfServices.experimentsKafka.value.topics.setsChangesTopic],
      handler: this.dataHandler,
    }]
    this.consumer.init(strategies)
  }

  static createConsumer(params) {
    return new Kafka.GroupConsumer(params)
  }

  dataHandler = (messageSet, topic, partition) => Promise.all(_.map(messageSet, (m) => {
    const message = m.message.value.slice(5)

    logger.info(topic, partition, m.offset)
    const type = avro.Type.forSchema({
      type: 'record',
      fields: [
        { name: 'resource_id', type: 'int' },
        { name: 'event_category', type: 'string' },
        { name: 'time', type: 'string' },
      ],
    })

    const data = type.fromBuffer(message)
    const eventCategory = data.event_category

    if (eventCategory === 'delete') {
      const setId = data.resource_id
      return this.clearSet(setId).then((setClearResults) => {
        if (setClearResults.length > 0) {
          logger.info(`Successfully cleared SetId: ${setId} and related set entry ids`)
          sendKafkaNotification('update', setClearResults[0].experiment_id)
        }
        this.consumer.commitOffset({
          topic, partition, offset: m.offset, metadata: 'optional',
        })
      }).catch((err) => {
        logger.error(`Failed to clear setId: ${setId}`, err)
      })
    }

    return Promise.resolve()
  }))

  @Transactional('ManageSetsChange')
  clearSet = (setId, tx) => db.unit.batchClearEntryIds(setId, tx)
    .then(() => db.group.clearSetId(setId, tx))
}

const setsChangesListener = new SetsChangesListener()
export default SetsChangesListener
export {
  setsChangesListener,
}
