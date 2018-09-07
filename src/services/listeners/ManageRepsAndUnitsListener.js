import Kafka from 'no-kafka'
import log4js from 'log4js'
import _ from 'lodash'
import VaultUtil from '../utility/VaultUtil'
import cfServices from '../utility/ServiceConfig'
import db from '../../db/DbManager'
import Transactional from '../../decorators/transactional'
import KafkaProducer from '../kafka/KafkaProducer'
import AppError from '../utility/AppError'
import ExperimentalUnitService from '../ExperimentalUnitService'

const logger = log4js.getLogger('ManageRepsAndUnitsListener')
class ManageRepsAndUnitsListener {
  experimentalUnitService = new ExperimentalUnitService()

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
    this.consumer = ManageRepsAndUnitsListener.createConsumer(params)
    const strategies = [{
      subscriptions: [cfServices.experimentsKafka.value.topics.repPackingTopic],
      handler: this.dataHandler,
    }]
    this.consumer.init(strategies)
  }

  static createConsumer(params) {
    return new Kafka.GroupConsumer(params)
  }

  dataHandler = (messageSet, topic, partition) => Promise.all(_.map(messageSet, (m) => {
    const message = m.message.value.toString('utf8')
    logger.info(topic, partition, m.offset, message)
    const set = JSON.parse(message)
    set.entryChanges = _.map(_.filter(set.entryChanges, 'id'), entryChange => ({
      rep: entryChange.repNumber,
      setEntryId: entryChange.id,
      treatmentId: entryChange.value,
    }))
    return this.adjustExperimentWithRepPackChanges(set).then(() => {
      logger.info(`Successfully updated set "${set.setId}" with rep packing changes.`)
      this.consumer.commitOffset({
        topic, partition, offset: m.offset, metadata: 'optional',
      })
    }).catch((err) => {
      logger.error(`Failed to update set "${set.setId}" with rep packing changes `, message, err)
    })
  }))

  @Transactional('ManageRepPacking')
  adjustExperimentWithRepPackChanges = (set, tx) => {
    if (set.setId && set.entryChanges) {
      const { setId } = set
      const unitsFromMessage = set.entryChanges
      return db.locationAssociation.findBySetId(setId, tx).then((assoc) => {
        if (!assoc) {
          return Promise.reject(AppError.notFound(`No experiment found for setId "${set.setId}".`))
        }
        const { location } = assoc
        const experimentId = assoc.experiment_id
        return this.experimentalUnitService.mergeSetEntriesToUnits(experimentId, unitsFromMessage,
          location, { userId: 'REP_PACKING' }, tx)
          .then(() => {
            ManageRepsAndUnitsListener.sendResponseMessage(set.setId, true)
          })
      }).catch((err) => {
        ManageRepsAndUnitsListener.sendResponseMessage(set.setId, false)
        return Promise.reject(err)
      })
    }
    ManageRepsAndUnitsListener.sendResponseMessage(set.setId, false)

    return Promise.reject(AppError.badRequest('The rep pack message was in an invalid format.'))
  }

  static sendResponseMessage = (setId, isSuccess) => {
    KafkaProducer.publish({
      topic: cfServices.experimentsKafka.value.topics.repPackingResultTopic,
      message: {
        setId,
        result: isSuccess ? 'SUCCESS' : 'FAILURE',
      },
    })
  }
}

const manageRepsAndUnitsListener = new ManageRepsAndUnitsListener()
export default ManageRepsAndUnitsListener
export {
  manageRepsAndUnitsListener,
}
