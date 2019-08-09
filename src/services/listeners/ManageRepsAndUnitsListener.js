import { ConsumerGroup } from 'kafka-node'
import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import VaultUtil from '../utility/VaultUtil'
import cfServices from '../utility/ServiceConfig'
import KafkaProducer from '../kafka/KafkaProducer'
import AppError from '../utility/AppError'
import ExperimentalUnitService from '../ExperimentalUnitService'
import SetEntryRemovalService from '../prometheus/SetEntryRemovalService'
import LocationAssociationWithBlockService from '../LocationAssociationWithBlockService'

const logger = log4js.getLogger('ManageRepsAndUnitsListener')
class ManageRepsAndUnitsListener {
  experimentalUnitService = new ExperimentalUnitService()

  locationAssocWithBlockService = new LocationAssociationWithBlockService()

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
      },
    }

    const topics = [cfServices.experimentsKafka.value.topics.repPackingTopic]
    this.consumer = ManageRepsAndUnitsListener.createConsumer(params, topics)

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

  dataHandler = (messageSet, topic, partition) => Promise.all(_.map(messageSet, (m) => {
    const message = m.value.toString('utf8')
    logger.info(topic, partition, m.offset, message)
    const set = JSON.parse(message)
    set.entryChanges = _.map(_.filter(set.entryChanges, entry => entry.avail !== 0),
      entryChange => ({
        rep: entryChange.repNumber,
        setEntryId: entryChange.id,
        treatmentId: entryChange.value,
      }))

    if (_.filter(set.entryChanges, entry => !entry.setEntryId).length > 0) {
      logger.warn('An error occurred while parsing the kafka message. At least one SetEntryId was not found.')
      SetEntryRemovalService.addWarning()
    }

    return this.adjustExperimentWithRepPackChanges(set).then(() => {
      logger.info(`Successfully updated set "${set.setId}" with rep packing changes.`)
    }).catch((err) => {
      logger.error(`Failed to update set "${set.setId}" with rep packing changes `, message, err)
    })
  }))

  @Transactional('ManageRepPacking')
  adjustExperimentWithRepPackChanges = (set, tx) => {
    if (set.setId && set.entryChanges) {
      const { setId } = set
      const unitsFromMessage = set.entryChanges
      return this.locationAssocWithBlockService.getBySetId(setId, tx).then((assoc) => {
        if (!assoc) {
          return Promise.reject(AppError.notFound(`No experiment found for setId "${set.setId}".`))
        }
        const { location, block } = assoc
        const experimentId = assoc.experiment_id
        return this.experimentalUnitService.mergeSetEntriesToUnits(experimentId, unitsFromMessage,
          location, block, { userId: 'REP_PACKING', isRepPacking: true }, tx)
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
