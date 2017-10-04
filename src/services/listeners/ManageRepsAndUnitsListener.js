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
      return db.group.findRepGroupsBySetId(setId, tx).then((groups) => {
        const groupIds = _.map(groups, 'id')
        db.unit.batchFindAllByGroupIds(groupIds, tx).then((unitsFromDB) => {
          const unitsFromDbCamelizeLower = inflector.transform(unitsFromDB, 'camelizeLower')
          _.forEach(unitsFromMessage, (unitM) => {
            const group = _.find(groups, g => Number(g.rep) === Number(unitM.rep))
            const groupId = group ? group.id : null
            unitM.groupId = groupId
          })
          const unitsFromDbSlim = _.map(unitsFromDbCamelizeLower, unit => _.pick(unit, 'rep', 'treatmentId', 'setEntryId', 'groupId'))
          const unitsToBeCreated = _.differenceBy(unitsFromMessage, unitsFromDbSlim, 'treatmentId', 'setEntryId', 'groupId')
          const unitsToBeUpdatedSlim = _.differenceBy(_.difference(unitsFromMessage,
            unitsToBeCreated),
            unitsFromDbSlim, 'treatmentId', 'setEntryId', 'groupId')
          const unitsToBeUpdated = _.forEach(unitsToBeUpdatedSlim, (unitTobeUpdated) => {
            unitTobeUpdated.id = _.find(unitsFromDbCamelizeLower, unitFromDb =>
            unitFromDb.treatmentId === unitTobeUpdated.treatmentId
            && unitFromDb.setEntryId === unitTobeUpdated.setEntryId).id
          })
          const unitsToBeDeleted = _.map(_.differenceBy(unitsFromDbCamelizeLower, unitsFromMessage, 'treatmentId', 'setEntryId', 'groupId'), 'id')
          const context = { userId: 'REP_PACKING' }
          const promises = []
          if (unitsToBeCreated.length > 0) {
            const units = _.partition(unitsToBeCreated, u => u.groupId === null)
            const unitsToBeCreatedForNewGroup = units[0]
            const unitsToBeCreatedForExistingGroup = units[1]
            if (unitsToBeCreatedForExistingGroup.length > 0) {
              promises.push(db.unit.batchCreate(unitsToBeCreatedForExistingGroup,
                context, tx))
            }
            promises.concat(ManageRepsAndUnitsListener
              .getPromisesWhenGroupIsNull(unitsToBeCreatedForNewGroup, groups, context, tx))
          }
          if (unitsToBeUpdated.length > 0) {
            promises.push(db.unit.batchUpdate(unitsToBeUpdated,
              context, tx))
          }
          return Promise.all(promises)
            .then(() => {
              if (unitsToBeDeleted.length > 0) {
                db.unit.batchRemove(unitsToBeDeleted).then(() => {
                  db.unit.getUnitsCountByGroupIds(groupIds, tx).then((unitGs) => {
                    const groupIdstoBeDeleted = _.compact(_.map(unitGs, (ug) => {
                      if (ug.count === 0) {
                        return ug.id
                      }
                      return ''
                    }))
                    db.group.batchRemove(groupIdstoBeDeleted, tx)
                  })
                })
              }
              return Promise.resolve()
            })
        })
      })
    }

    return Promise.reject()
  }

  static getPromisesWhenGroupIsNull(unitsToBeCreatedForNewGroup, groups,
    context, tx) {
    const newGroupsTobeCreatedPromises = []
    if (unitsToBeCreatedForNewGroup.length > 0) {
      const groupedUnits = _.groupBy(unitsToBeCreatedForNewGroup, 'rep')
      _.forEach(_.keys(groupedUnits), (rep) => {
        const newGroup = _.pick(inflector.transform(groups, 'camelizeLower')[0], 'experimentId', 'parentId', 'refRandomizationStrategyId', 'refGroupTypeId')
        newGroup.rep = rep
        const prms = db.group.batchCreate([newGroup],
          context, tx).then((groupResp) => {
            const newGroupValue = {
              name: 'repNumber',
              value: rep,
              groupId: groupResp[0].id,
            }
            const unitsC = _.map(groupedUnits[rep], (unit) => {
              unit.groupId = groupResp[0].id
              return unit
            })
            Promise.all([db.groupValue.batchCreate([newGroupValue], context, tx),
              db.unit.batchCreate(unitsC, context, tx)])
          })
        newGroupsTobeCreatedPromises.push(prms)
      })
    }
    return newGroupsTobeCreatedPromises
  }

}

const manageRepsAndUnitsListener = new ManageRepsAndUnitsListener()
export default manageRepsAndUnitsListener
export {
  manageRepsAndUnitsListener,
}

