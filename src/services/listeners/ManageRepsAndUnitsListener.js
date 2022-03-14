import { ConsumerGroup } from 'kafka-node'
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import { dbRead } from '../../db/DbManager'
import configurator from '../../configs/configurator'
import KafkaProducer from '../kafka/KafkaProducer'
import AppError from '../utility/AppError'
import ExperimentalUnitService from '../ExperimentalUnitService'
import LocationAssociationWithBlockService from '../LocationAssociationWithBlockService'

class ManageRepsAndUnitsListener {
  experimentalUnitService = new ExperimentalUnitService()

  locationAssocWithBlockService = new LocationAssociationWithBlockService()

  listen() {
    const params = {
      client_id: configurator.get('client.clientId'),
      groupId: configurator.get('client.clientId'),
      kafkaHost: configurator.get('kafka.host'),
      ssl: true,
      sslOptions: {
        cert: configurator.get('kafka.clientCert'),
        key: configurator.get('kafka.privateKey'),
        passphrase: configurator.get('kafka.password'),
        ca: configurator.get('kafka.ca'),
      },
    }

    const topics = [configurator.get('kafka.topics.repPackingTopic')]
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
    console.info(topic, partition, m.offset, message)
    const set = JSON.parse(message)
    set.entryChanges = _.map(_.filter(set.entryChanges, entry => entry.avail !== 0),
      entryChange => ({
        rep: entryChange.repNumber,
        setEntryId: entryChange.id,
        treatmentId: entryChange.value,
      }))

    if (_.filter(set.entryChanges, entry => !entry.setEntryId).length > 0) {
      console.warn('An error occurred while parsing the kafka message. At least one SetEntryId was not found.')
    }

    return this.adjustExperimentWithRepPackChanges(set).then(() => {
      console.info(`Successfully updated set "${set.setId}" with rep packing changes.`)
    }).catch((err) => {
      console.error(`Failed to update set "${set.setId}" with rep packing changes `, message, err)
    })
  }))

  @Transactional('ManageRepPacking')
  adjustExperimentWithRepPackChanges = (set, tx) => {
    if (set.setId && set.entryChanges) {
      const { setId } = set
      const unitsFromMessage = set.entryChanges
      return this.locationAssocWithBlockService.getBySetId(setId).then((assoc) => {
        if (!assoc) {
          return Promise.reject(AppError.notFound(`No experiment found for setId "${set.setId}".`))
        }
        const { location } = assoc
        const blockId = assoc.block_id
        const experimentId = assoc.experiment_id
        return dbRead.treatmentBlock.batchFindByBlockIds(blockId)
          .then(treatmentBlocks =>
            this.experimentalUnitService.mergeSetEntriesToUnits(experimentId, unitsFromMessage,
              location, treatmentBlocks, { userId: 'REP_PACKING', isRepPacking: true }, tx)
              .then(() => {
                ManageRepsAndUnitsListener.sendResponseMessage(set.setId, true)
              }))
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
      topic: configurator.get('kafka.topics.repPackingResultTopic'),
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
