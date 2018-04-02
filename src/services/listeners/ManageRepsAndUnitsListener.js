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
      let experimentIds
      return db.group.findRepGroupsBySetId(setId, tx).then((groups) => {
        if (groups.length === 0) {
          return Promise.reject(AppError.notFound(`No groups found for setId "${set.setId}".`))
        }
        const groupIds = _.map(groups, 'id')
        experimentIds = _.uniqBy(groups, 'experiment_id')
        return db.unit.batchFindAllByGroupIds(groupIds, tx).then((unitsFromDB) => {
          const {
            groupsToBeCreated, unitsToBeCreated, unitsToBeDeleted, unitsToBeUpdated,
          } = this.getDbActions(unitsFromMessage, unitsFromDB, groups)
          return this.saveToDb(setId, unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted,
            groupsToBeCreated, tx)
        })
      }).then(() => {
        _.forEach(experimentIds, id => sendKafkaNotification('update', id.experiment_id))
        ManageRepsAndUnitsListener.sendResponseMessage(set.setId, true)
      }).catch((err) => {
        ManageRepsAndUnitsListener.sendResponseMessage(set.setId, false)
        return Promise.reject(err)
      })
    }
    ManageRepsAndUnitsListener.sendResponseMessage(set.setId, false)

    return Promise.reject(AppError.badRequest('The rep pack message was in an invalid format.'))
  }

  getDbActions = (unitsFromMessage, unitsFromDB, groups) => {
    const unitsFromDbCamelizeLower = inflector.transform(unitsFromDB, 'camelizeLower')
    _.forEach(unitsFromMessage, (unitM) => {
      const group = _.find(groups, g => Number(g.rep) === Number(unitM.rep))
      unitM.groupId = group ? group.id : null
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

    const repsToBeCreated = _.uniq(_.map(
      _.filter([].concat(unitsToBeCreated).concat(unitsToBeUpdated),
        unit => _.isNil(unit.groupId)), 'rep'))
    const groupTemplate = _.pick(inflector.transform(groups, 'camelizeLower')[0],
      'experimentId', 'parentId', 'refRandomizationStrategyId', 'refGroupTypeId')

    const groupsToBeCreated = _.map(repsToBeCreated, rep =>
      Object.assign({ rep }, groupTemplate))

    return {
      groupsToBeCreated,
      unitsToBeCreated,
      unitsToBeUpdated,
      unitsToBeDeleted,
    }
  }

  saveToDb = (
    setId, unitsToBeCreated, unitsToBeUpdated, unitsToBeDeleted, groupsToBeCreated, tx,
  ) => {
    const context = { userId: 'REP_PACKING' }
    return ManageRepsAndUnitsListener.createGroups(groupsToBeCreated, context, tx)
      .then(() => {
        const promises = []
        if (unitsToBeCreated.length > 0) {
          ManageRepsAndUnitsListener.addGroupIdToUnits(groupsToBeCreated, unitsToBeCreated)
          promises.push(db.unit.batchCreate(unitsToBeCreated, context, tx))
        }
        if (unitsToBeUpdated.length > 0) {
          ManageRepsAndUnitsListener.addGroupIdToUnits(groupsToBeCreated, unitsToBeUpdated)
          promises.push(db.unit.batchUpdate(unitsToBeUpdated, context, tx))
        }
        return Promise.all(promises)
          .then(() => {
            if (unitsToBeDeleted.length > 0) {
              return db.unit.batchRemove(unitsToBeDeleted)
            }
            return Promise.resolve()
          })
      })
      .then(() => db.unit.getGroupsWithNoUnits(setId, tx))
      .then(groupIdstoBeDeleted => db.group.batchRemove(_.map(groupIdstoBeDeleted, 'id'), tx))
  }

  static addGroupIdToUnits = (groups, units) => {
    _.forEach(_.filter(units, unit => !unit.groupId), (unit) => {
      const parentGroup = _.find(groups, group => group.rep === unit.rep)
      if (!parentGroup) {
        throw new Error(`Unable to find a parent group for set entry ${unit.setEntryId}`)
      }
      unit.groupId = parentGroup.id
    })
  }

  static createGroups = (groupsToBeCreated, context, tx) => {
    if (groupsToBeCreated && groupsToBeCreated.length > 0) {
      return db.group.batchCreate(groupsToBeCreated, context, tx)
        .then((groupResponse) => {
          const groupValues = _.map(groupsToBeCreated, (group, index) => {
            group.id = groupResponse[index].id

            return {
              name: 'repNumber',
              value: group.rep,
              groupId: group.id,
            }
          })
          return db.groupValue.batchCreate(groupValues, context, tx)
        })
    }
    return Promise.resolve()
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
