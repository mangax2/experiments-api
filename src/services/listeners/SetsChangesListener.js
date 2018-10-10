import { ConsumerGroup } from 'kafka-node'
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
      kafkaHost: cfServices.experimentsKafka.value.host,
      ssl: true,
      sslOptions: {
        cert: VaultUtil.kafkaClientCert,
        key: VaultUtil.kafkaPrivateKey,
        passphrase: VaultUtil.kafkaPassword,
        ca: VaultUtil.kafkaCA,
        rejectUnauthorized: false,
      },
      encoding: 'buffer',
    }

    const topics = [cfServices.experimentsKafka.value.topics.setsChangesTopic]
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

    logger.info(m.topic, m.partition, m.offset)
    const type = avro.Type.forSchema({
      type: 'record',
      fields: [
        { name: 'resource_id', type: 'int' },
        { name: 'event_category', type: 'string' },
        { name: 'time', type: 'string' },
      ],
    })

    const data = type.fromBuffer(message.slice(5))
    const eventCategory = data.event_category

    if (eventCategory === 'delete') {
      const setId = data.resource_id
      return this.clearSet(setId).then((setClearResults) => {
        if (!_.isNil(setClearResults)) {
          logger.info(`Successfully cleared SetId: ${setId} and related set entry ids`)
          sendKafkaNotification('update', setClearResults.experiment_id)
        }
      }).catch((err) => {
        logger.error(`Failed to clear setId: ${setId}`, err)
        return Promise.reject(err)
      })
    }

    return Promise.resolve()
  }))

  @Transactional('ManageSetsChange')
  clearSet = (setId, tx) => db.unit.batchClearEntryIds(setId, tx)
    .then(() => db.locationAssociation.removeBySetId(setId, tx))
}

const setsChangesListener = new SetsChangesListener()
export default SetsChangesListener
export {
  setsChangesListener,
}
