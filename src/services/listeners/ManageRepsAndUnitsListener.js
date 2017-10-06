import Kafka from 'no-kafka'
import log4js from 'log4js'
import _ from 'lodash'
import inflector from 'json-inflector'
import VaultUtil from '../utility/VaultUtil'
import cfServices from '../utility/ServiceConfig'
import db from '../../db/DbManager'
import Transactional from '../../decorators/transactional'
import KafkaProducer from '../kafka/KafkaProducer'

const logger = log4js.getLogger('ManageRepsAndUnitsListener')
class ManageRepsAndUnitsListener {
  listen() {
    const params = {
      client_id: VaultUtil.clientId,
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
    return this.adjustExperimentWithRepPackChanges(set).then(() => {
      this.consumer.commitOffset({ topic, partition, offset: m.offset, metadata: 'optional' })
    }).catch((err) => {
      logger.error('Failed to update experiment with rep packing changes ', message, err)
    })
  }))

  @Transactional('ManageRepPacking')
  adjustExperimentWithRepPackChanges = (set, tx) => {
    if (set.setId && set.payload) {
      const setId = set.setId
      const unitsFromMessage = set.payload
      return db.group.findRepGroupsBySetId(setId, tx).then((groups) => {
        const groupIds = _.map(groups, 'id')
        return db.unit.batchFindAllByGroupIds(groupIds, tx).then((unitsFromDB) => {
          const { unitsToBeCreated, unitsToBeDeleted, unitsToBeUpdated }
            = this.getDbActions(unitsFromMessage, unitsFromDB, groups)
          return this.saveToDb(setId, groups, unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted,
            tx)
        })
      }).then(() => {
        ManageRepsAndUnitsListener.sendResponseMessage(set.setId, true)
      }).catch((err) => {
        ManageRepsAndUnitsListener.sendResponseMessage(set.setId, false)
        return Promise.reject(err)
      })
    }
    ManageRepsAndUnitsListener.sendResponseMessage(set.setId, false)

    return Promise.reject()
  }

  getDbActions = (unitsFromMessage, unitsFromDB, groups) => {
    const unitsFromDbCamelizeLower = inflector.transform(unitsFromDB, 'camelizeLower')
    _.forEach(unitsFromMessage, (unitM) => {
      const group = _.find(groups, g => Number(g.rep) === Number(unitM.rep))
      const groupId = group ? group.id : null
      unitM.groupId = groupId
    })
    const unitsFromDbSlim = _.map(unitsFromDbCamelizeLower, unit => _.pick(unit, 'rep', 'treatmentId', 'setEntryId', 'groupId'))
    const unitsToBeCreated = _.differenceBy(unitsFromMessage, unitsFromDbSlim, 'setEntryId')
    const unitsToBeDeleted = _.map(_.differenceBy(unitsFromDbCamelizeLower, unitsFromMessage, 'setEntryId'), 'id')
    const unitsToBeUpdatedSlim = _.differenceWith(_.difference(unitsFromMessage,
      unitsToBeCreated),
      unitsFromDbSlim, _.isEqual)
    const unitsToBeUpdated = _.map(unitsToBeUpdatedSlim, (unitToBeUpdated) => {
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

  saveToDb = (setId, groups, unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted, tx) => {
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
          return db.unit.batchRemove(unitsToBeDeleted)
        }
        return Promise.resolve()
      })
      .then(() => db.unit.getGroupsWithNoUnits(setId, tx).then(groupIdstoBeDeleted =>
        db.group.batchRemove(_.map(groupIdstoBeDeleted, 'id'), tx)))
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

  static getPromisesWhenGroupIsNull(unitsToBeCreatedForNewGroup, groups,
    context, tx) {
    const newGroupsToBeCreatedPromises = []
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
            return Promise.all([db.groupValue.batchCreate([newGroupValue], context, tx),
              db.unit.batchCreate(unitsC, context, tx)])
          })
        newGroupsToBeCreatedPromises.push(prms)
      })
    }
    return newGroupsToBeCreatedPromises
  }

}

const manageRepsAndUnitsListener = new ManageRepsAndUnitsListener()
export default ManageRepsAndUnitsListener
export {
  manageRepsAndUnitsListener,
}
