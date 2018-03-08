import ManageRepsAndUnitsListener from '../../../src/services/listeners/ManageRepsAndUnitsListener'
import Kafka from 'no-kafka'
import VaultUtil from '../../../src/services/utility/VaultUtil'
import cfServices from '../../../src/services/utility/ServiceConfig'
import KafkaProducer from '../../../src/services/kafka/KafkaProducer'
import db from '../../../src/db/DbManager'
import { mockResolve, mock } from '../../jestUtil';

describe('ManageRepsAndUnitsListener', () => {
  describe('createConsumer', () => {
    test('creates an object of type Kafka.GroupConsumer', () => {
      expect(ManageRepsAndUnitsListener.createConsumer() instanceof Kafka.GroupConsumer).toBe(true)
    })
  })

  describe('sendResponseMessage', () => {
    test('sends a success if isSuccess', () => {
      KafkaProducer.publish = jest.fn()
      cfServices.experimentsKafka = { value: { topics: { repPackingResultTopic: 'topic' } } }

      ManageRepsAndUnitsListener.sendResponseMessage(555, true)

      expect(KafkaProducer.publish).toBeCalledWith({
        topic: 'topic',
        message: { setId: 555, result: 'SUCCESS' },
      })
    })

    test('sends a failure if not isSuccess', () => {
      KafkaProducer.publish = jest.fn()
      cfServices.experimentsKafka = { value: { topics: { repPackingResultTopic: 'topic' } } }

      ManageRepsAndUnitsListener.sendResponseMessage(777, false)

      expect(KafkaProducer.publish).toBeCalledWith({
        topic: 'topic',
        message: { setId: 777, result: 'FAILURE' },
      })
    })
  })

  describe('listen', () => {
    test('calls things correctly', () => {
      const target = new ManageRepsAndUnitsListener()
      VaultUtil.kafkaClientCert = 'cert'
      VaultUtil.kafkaPrivateKey = 'key'
      VaultUtil.kafkaPassword = 'password'
      VaultUtil.clientId = 'PD-EXPERIMENTS-API-DEV-SVC'
      cfServices.experimentsKafka = { value: { host: 'host', topics: { repPackingTopic: 'topic' } } }
      const consumer = { init: jest.fn() }
      ManageRepsAndUnitsListener.createConsumer = jest.fn(() => consumer)

      target.listen()

      expect(consumer.init).toBeCalledWith([{ subscriptions: ['topic'], handler: target.dataHandler }])
      expect(target.consumer).toBe(consumer)
      expect(ManageRepsAndUnitsListener.createConsumer).toBeCalledWith({
        client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
        connectionString: 'host',
        reconnectionDelay: { min: 100000, max: 100000 },
        ssl: {
          cert: 'cert',
          key: 'key',
          passphrase: 'password',
        },
      })
    })
  })

  describe('dataHandler', () => {
    test('calls commitOffset on success', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { message: { value: { toString: jest.fn(() => '{ "setId": "1234", "entryChanges": [{ "avail": 0 }, { "id": 9886, "repNumber": 1, "value": 246 }] }') } }, offset: 3 }
      const consumer = { commitOffset: jest.fn() }
      target.adjustExperimentWithRepPackChanges = jest.fn(() => Promise.resolve())
      target.consumer = consumer

      return target.dataHandler([message], 'topic', 'partition').then(() => {
        expect(target.adjustExperimentWithRepPackChanges).toBeCalledWith({ setId: '1234', entryChanges: [{ setEntryId: 9886, rep: 1, treatmentId: 246 }] })
        expect(consumer.commitOffset).toBeCalledWith({
          topic: 'topic', partition: 'partition', offset: 3, metadata: 'optional',
        })
      })
    })

    test('does not call commitOffset on failure', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { message: { value: { toString: jest.fn(() => '{ "setId": "1234", "entryChanges": [{ "avail": 0 }, { "id": 9886, "repNumber": 1, "value": 246 }] }') } }, offset: 3 }
      const consumer = { commitOffset: jest.fn() }
      target.adjustExperimentWithRepPackChanges = jest.fn(() => Promise.reject())
      target.consumer = consumer

      return target.dataHandler([message], 'topic', 'partition').then(() => {
        expect(target.adjustExperimentWithRepPackChanges).toBeCalledWith({ setId: '1234', entryChanges: [{ setEntryId: 9886, rep: 1, treatmentId: 246 }] })
        expect(consumer.commitOffset).not.toBeCalled()
      })
    })
  })

  describe('adjustExperimentWithRepPackChanges', () => {
    test('publishes a success when successful', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5, entryChanges: [] }
      const groups = [{ id: 5 }]
      db.group = { findRepGroupsBySetId: jest.fn(() => Promise.resolve(groups)) }
      db.unit = { batchFindAllByGroupIds: jest.fn(() => Promise.resolve('unitsFromDb')) }
      target.getDbActions = jest.fn(() => ({
        unitsToBeCreated: 'create', unitsToBeDeleted: 'delete', unitsToBeUpdated: 'update', groupsToBeCreated: 'groups',
      }))
      target.saveToDb = jest.fn(() => Promise.resolve())
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).then(() => {
        expect(db.group.findRepGroupsBySetId).toBeCalledWith(5, testTx)
        expect(db.unit.batchFindAllByGroupIds).toBeCalledWith([5], testTx)
        expect(target.getDbActions).toBeCalledWith([], 'unitsFromDb', groups)
        expect(target.saveToDb).toBeCalledWith(5, 'create', 'update', 'delete', 'groups', testTx)
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, true)
      })
    })

    test('publishes a failure when on error', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5, entryChanges: [] }
      const groups = [{ id: 5 }]
      db.group = { findRepGroupsBySetId: jest.fn(() => Promise.resolve(groups)) }
      db.unit = { batchFindAllByGroupIds: jest.fn(() => Promise.resolve('unitsFromDb')) }
      target.getDbActions = jest.fn(() => ({
        unitsToBeCreated: 'create', unitsToBeDeleted: 'delete', unitsToBeUpdated: 'update', groupsToBeCreated: 'groups',
      }))
      target.saveToDb = jest.fn(() => Promise.reject(new Error('test')))
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch(() => {
        expect(db.group.findRepGroupsBySetId).toBeCalledWith(5, testTx)
        expect(db.unit.batchFindAllByGroupIds).toBeCalledWith([5], testTx)
        expect(target.getDbActions).toBeCalledWith([], 'unitsFromDb', groups)
        expect(target.saveToDb).toBeCalledWith(5, 'create', 'update', 'delete', 'groups', testTx)
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
      })
    })

    test('publishes a failure when on bad format', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5 }
      db.group = { findRepGroupsBySetId: jest.fn() }
      db.unit = { batchFindAllByGroupIds: jest.fn() }
      target.getDbActions = jest.fn()
      target.saveToDb = jest.fn()
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
        expect(db.group.findRepGroupsBySetId).not.toBeCalled()
        expect(db.unit.batchFindAllByGroupIds).not.toBeCalled()
        expect(target.getDbActions).not.toBeCalled()
        expect(target.saveToDb).not.toBeCalled()
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
        expect(err.status).toBe(400)
        expect(err.code).toBe('Bad Request')
        expect(err.message).toBe('The rep pack message was in an invalid format.')
      })
    })

    test('publishes a failure when no groups found', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5, entryChanges: [] }
      db.group = { findRepGroupsBySetId: jest.fn(() => Promise.resolve([])) }
      db.unit = { batchFindAllByGroupIds: jest.fn(() => Promise.resolve('unitsFromDb')) }
      target.getDbActions = jest.fn()
      target.saveToDb = jest.fn()
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
        expect(db.group.findRepGroupsBySetId).toBeCalled()
        expect(db.unit.batchFindAllByGroupIds).not.toBeCalled()
        expect(target.getDbActions).not.toBeCalled()
        expect(target.saveToDb).not.toBeCalled()
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
        expect(err.status).toBe(404)
        expect(err.code).toBe('Not Found')
        expect(err.message).toBe('No groups found for setId "5".')
      })
    })
  })

  describe('getDbActions', () => {
    test('correctly categorizes units', () => {
      const unitsFromMessage = [{
        rep: 1,
        setEntryId: 234,
        treatmentId: 7,
      }, {
        rep: 1,
        setEntryId: 235,
        treatmentId: 8,
      }, {
        rep: 1,
        setEntryId: 236,
        treatmentId: 9,
      }, {
        rep: 2,
        setEntryId: 237,
        treatmentId: 7,
      }]
      const unitsFromDb = [{
        id: 55,
        groupId: 5,
        rep: 1,
        setEntryId: 233,
        treatmentId: 8,
      }, {
        id: 66,
        groupId: 5,
        rep: 1,
        setEntryId: 234,
        treatmentId: 7,
      }, {
        id: 77,
        groupId: 5,
        rep: 1,
        setEntryId: 235,
        treatmentId: 9,
      }]
      const groups = [{ id: 5, rep: 1 }]

      const target = new ManageRepsAndUnitsListener()

      const result = target.getDbActions(unitsFromMessage, unitsFromDb, groups)

      expect(result).toEqual({
        groupsToBeCreated: [{ rep: 2 }],
        unitsToBeCreated: [{
          rep: 1,
          setEntryId: 236,
          treatmentId: 9,
          groupId: 5,
        }, {
          rep: 2,
          setEntryId: 237,
          treatmentId: 7,
          groupId: null,
        }],
        unitsToBeUpdated: [{
          id: 77,
          groupId: 5,
          rep: 1,
          setEntryId: 235,
          treatmentId: 8,
        }],
        unitsToBeDeleted: [55],
      })
    })
  })

  describe('addGroupIdToUnits', () => {
    test('only changes groupId of units without groupId', () => {
      const groups = [{ rep: 3, id: 5 }, { rep: 5, id: 7 }]
      const units = [{ rep: 5 }, { rep: 3, groupId: 3 }]

      ManageRepsAndUnitsListener.addGroupIdToUnits(groups, units)

      expect(units).toEqual([{ rep: 5, groupId: 7 }, { rep: 3, groupId: 3 }])
    })

    test('throws an exception when a group is not found for a unit', () => {
      const groups = [{ rep: 3, id: 5 }]
      const units = [{ rep: 5, setEntryId: 9 }]

      expect(() => ManageRepsAndUnitsListener.addGroupIdToUnits(groups, units))
        .toThrow('Unable to find a parent group for set entry 9')
    })
  })

  describe('createGroups', () => {
    test('makes no calls to the database if empty array', () => {
      db.group.batchCreate = mockResolve()
      db.groupValue.batchCreate = mockResolve()

      return ManageRepsAndUnitsListener.createGroups([], {}, {}).then(() => {
        expect(db.group.batchCreate).not.toBeCalled()
        expect(db.groupValue.batchCreate).not.toBeCalled()
      })
    })

    test('calls the database and assigns group ids as expected', () => {
      const groups = [{ rep: 5 }, { rep: 3 }, { rep: 7 }]
      db.group.batchCreate = mockResolve([2, 4, 6])
      db.groupValue.batchCreate = mockResolve()
      
      return ManageRepsAndUnitsListener.createGroups(groups, {}, {}).then(() => {
        expect(db.group.batchCreate).toBeCalledWith(groups, {}, {})
        expect(db.groupValue.batchCreate).toBeCalledWith([
          { name: 'repNumber', value: 5, groupId: 2 },
          { name: 'repNumber', value: 3, groupId: 4 },
          { name: 'repNumber', value: 7, groupId: 6 }], {}, {})
      })
    })
  })

  describe('saveToDb', () => {
    test('calls everything correctly when values are present', () => {
      const target = new ManageRepsAndUnitsListener()
      const context = { userId: 'REP_PACKING' }
      db.unit = {
        batchCreate: jest.fn(() => Promise.resolve()),
        batchUpdate: jest.fn(() => Promise.resolve()),
        batchRemove: jest.fn(() => Promise.resolve()),
        getGroupsWithNoUnits: jest.fn(() => Promise.resolve([{ id: 11 }])),
      }
      db.group = { batchRemove: jest.fn(() => Promise.resolve()) }
      ManageRepsAndUnitsListener.createGroups = jest.fn(() => Promise.resolve())
      ManageRepsAndUnitsListener.addGroupIdToUnits = mock()

      return target.saveToDb(9, [{ id: 3, groupId: 7 }, { id: 4, groupId: null }], [{ id: 5 }], [6], [], {}).then(() => {
        expect(db.unit.batchCreate).toBeCalledWith([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], context, {})
        expect(ManageRepsAndUnitsListener.createGroups).toBeCalledWith([], context, {})
        expect(ManageRepsAndUnitsListener.addGroupIdToUnits).toHaveBeenCalledTimes(2)
        expect(db.unit.batchUpdate).toBeCalledWith([{ id: 5 }], context, {})
        expect(db.unit.batchRemove).toBeCalledWith([6])
        expect(db.unit.getGroupsWithNoUnits).toBeCalledWith(9, {})
        expect(db.group.batchRemove).toBeCalledWith([11], {})
      })
    })

    test('calls everything correctly when values are not present', () => {
      const target = new ManageRepsAndUnitsListener()
      const context = { userId: 'REP_PACKING' }
      db.unit = {
        batchCreate: jest.fn(() => Promise.resolve()),
        batchUpdate: jest.fn(() => Promise.resolve()),
        batchRemove: jest.fn(() => Promise.resolve()),
        getGroupsWithNoUnits: jest.fn(() => Promise.resolve([{ id: 11 }])),
      }
      db.group = { batchRemove: jest.fn(() => Promise.resolve()) }
      ManageRepsAndUnitsListener.createGroups = jest.fn(() => Promise.resolve())
      ManageRepsAndUnitsListener.addGroupIdToUnits = mock()

      return target.saveToDb(9, [], [], [], [], {}).then(() => {
        expect(db.unit.batchCreate).not.toBeCalled()
        expect(ManageRepsAndUnitsListener.createGroups).toBeCalledWith([], context, {})
        expect(ManageRepsAndUnitsListener.addGroupIdToUnits).not.toBeCalled()
        expect(db.unit.batchUpdate).not.toBeCalled()
        expect(db.unit.batchRemove).not.toBeCalled()
        expect(db.unit.getGroupsWithNoUnits).toBeCalledWith(9, {})
        expect(db.group.batchRemove).toBeCalledWith([11], {})
      })
    })
  })
})
