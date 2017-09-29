import Kafka from 'no-kafka'
import log4js from 'log4js'
import _ from 'lodash'
import inflector from 'json-inflector'
import s3Object from '../utility/S3Utils'
import KafkaConfig from '../utility/KafkaConfig'
import cfServices from '../utility/ServiceConfig'
import db from '../../db/DbManager'
import Transactional from '../../decorators/transactional'

const kafkaCertPromise = s3Object({
  Bucket: KafkaConfig.s3Path,
  Key: `${KafkaConfig.certName}.cert`,
})
const kafkaKeyPromise = s3Object({ Bucket: KafkaConfig.s3Path, Key: `${KafkaConfig.keyName}.pem` })

const logger = log4js.getLogger('ManageRepsAndUnitsListener')
class ManageRepsAndUnitsListener {

  listen() {
    return Promise.all([kafkaCertPromise, kafkaKeyPromise]).then(([kafkaCert, kafkaKey]) => {
      const params = {
        client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
        connectionString: KafkaConfig.host,
        reconnectionDelay: {
          min: 100000,
          max: 100000,
        },
        ssl: {
          cert: kafkaCert.Body.toString(),
          key: kafkaKey.Body.toString(),
          passphrase: KafkaConfig.kafkaKeyPhrase,
        },
      }
      const dataHandler = (messageSet, topic, partition) => {
        messageSet.forEach((m) => {
          const message = m.message.value.toString('utf8')
          logger.info(topic, partition, m.offset, message)
          const set = JSON.parse(message)
          this.adjustExperimentWithRepPackChanges(set).then(() => {
            consumer.commitOffset({ topic, partition, offset: m.offset, metadata: 'optional' })
          }).catch((err) => {
            logger.error('Failed to update experiment with rep packing changes ', message, err)
          })
        })
      }
      const consumer = new Kafka.GroupConsumer(params)
      const strategies = [{
        subscriptions: [cfServices.kafkaTopics.repPackingTopic],
        handler: dataHandler,
      }]
      consumer.init(strategies)
    })
  }

  @Transactional('ManageRepPacking')
  adjustExperimentWithRepPackChanges = (set, tx) => {
    if (set.setId && set.payload) {
      const setId = set.setId
      const unitsFromMessage = set.payload
      return db.unit.findAllBySetId(setId, tx).then((unitsFromDB) => {
        const unitsFromDbCamelizeLower = inflector.transform(unitsFromDB, 'camelizeLower')
        const groupId = unitsFromDbCamelizeLower[0].groupId
        const unitsFromDbSlim = _.map(unitsFromDbCamelizeLower, unit => _.pick(unit, 'rep', 'treatmentId', 'setEntryId'))
        const unitsToBeCreated = _.differenceBy(unitsFromMessage, unitsFromDbSlim, 'treatmentId', 'setEntryId')
        const unitsToBeUpdatedSlim = _.differenceWith(_.difference(unitsFromMessage,
          unitsToBeCreated),
          unitsFromDbSlim, _.isEqual)
        const unitsToBeUpdated = _.forEach(unitsToBeUpdatedSlim, (unitTobeUpdated) => {
          unitTobeUpdated.id = _.find(unitsFromDbCamelizeLower, unitFromDb =>
          unitFromDb.treatmentId === unitTobeUpdated.treatmentId
          && unitFromDb.setEntryId === unitTobeUpdated.setEntryId).id
        })
        const unitsToBeDeleted = _.map(_.differenceBy(unitsFromDbCamelizeLower, unitsFromMessage, 'treatmentId', 'setEntryId'), 'id')
        const context = { userId: 'TBD' }
        const promises = []
        if (unitsToBeCreated.length > 0) {
          promises.push(db.unit.batchCreate(this.formatBatch(unitsToBeCreated, groupId),
            context, tx))
        }
        if (unitsToBeUpdated.length > 0) {
          promises.push(db.unit.batchUpdate(this.formatBatch(unitsToBeUpdated, groupId),
            context, tx))
        }
        return Promise.all(promises)
          .then(() => {
            if (unitsToBeDeleted.length > 0) {
              db.unit.batchRemove(unitsToBeDeleted)
            }
            return Promise.resolve()
          })
      })
    }
    return Promise.reject()
  }

  formatBatch = (units, groupId) => _.forEach(units, (unit) => {
    unit.groupId = groupId
  })

}

const manageRepsAndUnitsListener = new ManageRepsAndUnitsListener()
export default manageRepsAndUnitsListener
export { manageRepsAndUnitsListener }

