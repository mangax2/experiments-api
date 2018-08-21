import Kafka from 'no-kafka'
import log4js from 'log4js'
import _ from 'lodash'
import inflector from 'json-inflector'
import VaultUtil from '../utility/VaultUtil'
import cfServices from '../utility/ServiceConfig'
import db from '../../db/DbManager'
import Transactional from '../../decorators/transactional'
import KafkaProducer from '../kafka/KafkaProducer'
import AppError from '../utility/AppError'
import { sendKafkaNotification } from '../../decorators/notifyChanges'

const logger = log4js.getLogger('ManageRepsAndUnitsListener')
class ManageRepsAndUnitsListener {
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
        return db.unit.batchFindAllByExperimentIdAndLocation(experimentId, location, tx)
          .then((unitsFromDB) => {
            const {
              unitsToBeCreated, unitsToBeDeleted, unitsToBeUpdated,
            } = this.getDbActions(unitsFromMessage, unitsFromDB, location)
            return this.saveToDb(unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted, tx)
          }).then(() => {
            sendKafkaNotification('update', experimentId)
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

  getDbActions = (unitsFromMessage, unitsFromDB, location) => {
    const unitsFromDbCamelizeLower = inflector.transform(unitsFromDB, 'camelizeLower')
    _.forEach(unitsFromMessage, (unitM) => {
      unitM.location = location
    })
    const unitsFromDbSlim = _.map(unitsFromDbCamelizeLower, unit => _.pick(unit, 'rep', 'treatmentId', 'setEntryId', 'location'))
    const unitsToBeCreated = _.differenceBy(unitsFromMessage, unitsFromDbSlim, 'setEntryId')
    const unitsToBeDeleted = _.map(_.differenceBy(unitsFromDbCamelizeLower, unitsFromMessage, 'setEntryId'), 'id')
    const unitsThatAlreadyExist = _.difference(unitsFromMessage, unitsToBeCreated)
    const unitsThatNeedUpdating = _.differenceWith(unitsThatAlreadyExist,
      unitsFromDbSlim, _.isEqual)
    const unitsToBeUpdated = _.map(unitsThatNeedUpdating, (unitToBeUpdated) => {
      unitToBeUpdated.id = _.find(unitsFromDbCamelizeLower, unitFromDb =>
        unitFromDb.setEntryId === unitToBeUpdated.setEntryId).id
      return unitToBeUpdated
    })

    return {
      unitsToBeCreated,
      unitsToBeUpdated,
      unitsToBeDeleted,
    }
  }

  saveToDb = (unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted, tx) => {
    const context = { userId: 'REP_PACKING' }
    const promises = []
    if (unitsToBeCreated.length > 0) {
      promises.push(db.unit.batchCreate(unitsToBeCreated, context, tx))
    }
    if (unitsToBeUpdated.length > 0) {
      promises.push(db.unit.batchUpdate(unitsToBeUpdated, context, tx))
    }
    return Promise.all(promises)
      .then(() => {
        if (unitsToBeDeleted.length > 0) {
          return db.unit.batchRemove(unitsToBeDeleted)
        }
        return Promise.resolve()
      })
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
