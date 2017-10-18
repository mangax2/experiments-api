import ManageRepsAndUnitsListener from '../../../src/services/listeners/ManageRepsAndUnitsListener'
import Kafka from 'no-kafka'
import VaultUtil from '../../../src/services/utility/VaultUtil'
import cfServices from '../../../src/services/utility/ServiceConfig'
import KafkaProducer from '../../../src/services/kafka/KafkaProducer'
import db from '../../../src/db/DbManager'

describe('ManageRepsAndUnitsListener', () => {
  describe('createConsumer', () => {
    it('creates an object of type Kafka.GroupConsumer', () => {
      expect(ManageRepsAndUnitsListener.createConsumer() instanceof Kafka.GroupConsumer).toBe(true)
    })
  })

  describe('sendResponseMessage', () => {
    it('sends a success if isSuccess', () => {
      KafkaProducer.publish = jest.fn()
      cfServices.experimentsKafka = { value: { topics: { repPackingResultTopic: 'topic' } } }

      ManageRepsAndUnitsListener.sendResponseMessage(555, true)

      expect(KafkaProducer.publish).toBeCalledWith({
        topic: 'topic',
        message: { setId: 555, result: 'SUCCESS' }
      })
    })

    it('sends a failure if not isSuccess', () => {
      KafkaProducer.publish = jest.fn()
      cfServices.experimentsKafka = { value: { topics: { repPackingResultTopic: 'topic' } } }

      ManageRepsAndUnitsListener.sendResponseMessage(777, false)

      expect(KafkaProducer.publish).toBeCalledWith({
        topic: 'topic',
        message: { setId: 777, result: 'FAILURE' }
      })
    })
  })

  describe('listen', () => {
    it('calls things correctly', () => {
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
          passphrase: 'password'
        }
      })
    })
  })

  describe('dataHandler', () => {
    it('calls commitOffset on success', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { message: { value: { toString: jest.fn(() => '{ "setId": "1234", "entryChanges": [{ "avail": 0 }, { "id": 9886, "repNumber": 1, "value": 246 }] }') } }, offset: 3 }
      const consumer = { commitOffset: jest.fn() }
      target.adjustExperimentWithRepPackChanges = jest.fn(() => Promise.resolve())
      target.consumer = consumer

      return target.dataHandler([message], 'topic', 'partition').then(() => {
        expect(target.adjustExperimentWithRepPackChanges).toBeCalledWith({ setId: '1234', entryChanges: [{ setEntryId: 9886, rep: 1, treatmentId: 246}] })
        expect(consumer.commitOffset).toBeCalledWith({ topic: 'topic', partition: 'partition', offset: 3, metadata: 'optional' })
      })
    })

    it('does not call commitOffset on failure', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { message: { value: { toString: jest.fn(() => '{ "setId": "1234", "entryChanges": [{ "avail": 0 }, { "id": 9886, "repNumber": 1, "value": 246 }] }') } }, offset: 3 }
      const consumer = { commitOffset: jest.fn() }
      target.adjustExperimentWithRepPackChanges = jest.fn(() => Promise.reject())
      target.consumer = consumer

      return target.dataHandler([message], 'topic', 'partition').then(() => {
        expect(target.adjustExperimentWithRepPackChanges).toBeCalledWith({ setId: '1234', entryChanges: [{ setEntryId: 9886, rep: 1, treatmentId: 246}] })
        expect(consumer.commitOffset).not.toBeCalled()
      })
    })
  })

  describe('adjustExperimentWithRepPackChanges', () => {
    it('publishes a success when successful', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5, entryChanges: [] }
      const groups = [{ id: 5 }]
      db.group = { findRepGroupsBySetId: jest.fn(() => Promise.resolve(groups))}
      db.unit = { batchFindAllByGroupIds: jest.fn(() => Promise.resolve('unitsFromDb'))}
      target.getDbActions = jest.fn(() => ({ unitsToBeCreated: 'create', unitsToBeDeleted: 'delete', unitsToBeUpdated: 'update'}))
      target.saveToDb = jest.fn(() => Promise.resolve())
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = {}

      return target.adjustExperimentWithRepPackChanges(message, testTx).then(() => {
        expect(db.group.findRepGroupsBySetId).toBeCalledWith(5, testTx)
        expect(db.unit.batchFindAllByGroupIds).toBeCalledWith([5], testTx)
        expect(target.getDbActions).toBeCalledWith([], 'unitsFromDb', groups)
        expect(target.saveToDb).toBeCalledWith(5, groups, 'create', 'update', 'delete', testTx)
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, true)
      })
    })

    it('publishes a failure when on error', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5, entryChanges: [] }
      const groups = [{ id: 5 }]
      db.group = { findRepGroupsBySetId: jest.fn(() => Promise.resolve(groups))}
      db.unit = { batchFindAllByGroupIds: jest.fn(() => Promise.resolve('unitsFromDb'))}
      target.getDbActions = jest.fn(() => ({ unitsToBeCreated: 'create', unitsToBeDeleted: 'delete', unitsToBeUpdated: 'update'}))
      target.saveToDb = jest.fn(() => Promise.reject('test'))
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = {}

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
        expect(db.group.findRepGroupsBySetId).toBeCalledWith(5, testTx)
        expect(db.unit.batchFindAllByGroupIds).toBeCalledWith([5], testTx)
        expect(target.getDbActions).toBeCalledWith([], 'unitsFromDb', groups)
        expect(target.saveToDb).toBeCalledWith(5, groups, 'create', 'update', 'delete', testTx)
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
        expect(err).toBe('test')
      })
    })
    
    it('publishes a failure when on bad format', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5 }
      db.group = { findRepGroupsBySetId: jest.fn()}
      db.unit = { batchFindAllByGroupIds: jest.fn()}
      target.getDbActions = jest.fn()
      target.saveToDb = jest.fn()
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = {}

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
        expect(db.group.findRepGroupsBySetId).not.toBeCalled()
        expect(db.unit.batchFindAllByGroupIds).not.toBeCalled()
        expect(target.getDbActions).not.toBeCalled()
        expect(target.saveToDb).not.toBeCalled()
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
        expect(err).toBe(undefined)
      })
    })
  })

  describe('getDbActions', () => {
    it('correctly categorizes units', () => {
      const unitsFromMessage = [{
          rep: 1,
          setEntryId: 234,
          treatmentId: 7,
        },{
          rep: 1,
          setEntryId: 235,
          treatmentId: 8,
        },{
          rep: 1,
          setEntryId: 236,
          treatmentId: 9,
        },{
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
        },{
          id: 66,
          groupId: 5,
          rep: 1,
          setEntryId: 234,
          treatmentId: 7,
        },{
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
        unitsToBeCreated: [{
            rep: 1,
            setEntryId: 236,
            treatmentId: 9,
            groupId: 5,
          },{
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
        unitsToBeDeleted: [55]
      })
    })
  })

  describe('getPromisesWhenGroupIsNull', () => {
    it('calls everything correctly when there are units', () => {
      const unitsToBeCreated = [{ id: 5, rep: 1, groupId: 11 }, { id: 7, rep: 1, groupId: 11 }]
      const existingGroups = [{ experimentId: 25, parentId: 27, refRandomizationStrategyId: 1, refGroupTypeId: 3, rep: "1" }]
      const context = { userId: 'test' }
      db.group = { batchCreate: jest.fn(() => Promise.resolve([{ id: 11 }])) }
      db.groupValue = { batchCreate: jest.fn(() => Promise.resolve()) }
      db.unit = { batchCreate: jest.fn(() => Promise.resolve()) }

      return Promise.all(ManageRepsAndUnitsListener.getPromisesWhenGroupIsNull(unitsToBeCreated, existingGroups, context, {}))
        .then(() => {
          expect(db.group.batchCreate).toBeCalledWith(existingGroups, context, {})
          expect(db.groupValue.batchCreate).toBeCalledWith([{ name: 'repNumber', value: "1", groupId: 11 }], context, {})
          expect(db.unit.batchCreate).toBeCalledWith(unitsToBeCreated, context, {})
        })
    })

    it('does nothing if there are no units', () => {
      const context = { userId: 'test' }
      db.group = { batchCreate: jest.fn(() => Promise.resolve([{ id: 11 }])) }
      db.groupValue = { batchCreate: jest.fn(() => Promise.resolve()) }
      db.unit = { batchCreate: jest.fn(() => Promise.resolve()) }

      const result = ManageRepsAndUnitsListener.getPromisesWhenGroupIsNull([], [], context, {})
      expect(result.length).toBe(0)
      expect(db.group.batchCreate).not.toBeCalled()
      expect(db.groupValue.batchCreate).not.toBeCalled()
      expect(db.unit.batchCreate).not.toBeCalled()
    })
  })

  describe('saveToDb', () => {
    it('calls everything correctly when values are present', () => {
      const target = new ManageRepsAndUnitsListener()
      const context = { userId: 'REP_PACKING' }
      db.unit = {
        batchCreate: jest.fn(() => Promise.resolve()),
        batchUpdate: jest.fn(() => Promise.resolve()),
        batchRemove: jest.fn(() => Promise.resolve()),
        getGroupsWithNoUnits: jest.fn(() => Promise.resolve([{ id: 11 }]))
      }
      db.group = { batchRemove: jest.fn(() => Promise.resolve()) }
      ManageRepsAndUnitsListener.getPromisesWhenGroupIsNull = jest.fn(() => Promise.resolve())

      return target.saveToDb(9, [], [{ id: 3, groupId: 7 }, { id: 4, groupId: null }], [{ id: 5 }], [6], {}).then(() => {
        expect(db.unit.batchCreate).toBeCalledWith([{ id: 3, groupId: 7 }], context, {})
        expect(ManageRepsAndUnitsListener.getPromisesWhenGroupIsNull).toBeCalledWith([{ id: 4, groupId: null }], [], context, {})
        expect(db.unit.batchUpdate).toBeCalledWith([{ id: 5}], context, {})
        expect(db.unit.batchRemove).toBeCalledWith([6])
        expect(db.unit.getGroupsWithNoUnits).toBeCalledWith(9, {})
        expect(db.group.batchRemove).toBeCalledWith([11], {})
      })
    })

    it('calls everything correctly when values are not present', () => {
      const target = new ManageRepsAndUnitsListener()
      const context = { userId: 'REP_PACKING' }
      db.unit = {
        batchCreate: jest.fn(() => Promise.resolve()),
        batchUpdate: jest.fn(() => Promise.resolve()),
        batchRemove: jest.fn(() => Promise.resolve()),
        getGroupsWithNoUnits: jest.fn(() => Promise.resolve([{ id: 11 }]))
      }
      db.group = { batchRemove: jest.fn(() => Promise.resolve()) }
      ManageRepsAndUnitsListener.getPromisesWhenGroupIsNull = jest.fn(() => Promise.resolve())

      return target.saveToDb(9, [], [], [], [], {}).then(() => {
        expect(db.unit.batchCreate).not.toBeCalled()
        expect(ManageRepsAndUnitsListener.getPromisesWhenGroupIsNull).not.toBeCalled()
        expect(db.unit.batchUpdate).not.toBeCalled()
        expect(db.unit.batchRemove).not.toBeCalled()
        expect(db.unit.getGroupsWithNoUnits).toBeCalledWith(9, {})
        expect(db.group.batchRemove).toBeCalledWith([11], {})
      })
    })

    it('calls everything except unit batchCreate when all units to create are for new groups', () => {
      const target = new ManageRepsAndUnitsListener()
      const context = { userId: 'REP_PACKING' }
      db.unit = {
        batchCreate: jest.fn(() => Promise.resolve()),
        batchUpdate: jest.fn(() => Promise.resolve()),
        batchRemove: jest.fn(() => Promise.resolve()),
        getGroupsWithNoUnits: jest.fn(() => Promise.resolve([{ id: 11 }]))
      }
      db.group = { batchRemove: jest.fn(() => Promise.resolve()) }
      ManageRepsAndUnitsListener.getPromisesWhenGroupIsNull = jest.fn(() => Promise.resolve())

      return target.saveToDb(9, [], [{ id: 4, groupId: null }], [{ id: 5 }], [6], {}).then(() => {
        expect(db.unit.batchCreate).not.toBeCalled()
        expect(ManageRepsAndUnitsListener.getPromisesWhenGroupIsNull).toBeCalledWith([{ id: 4, groupId: null }], [], context, {})
        expect(db.unit.batchUpdate).toBeCalledWith([{ id: 5}], context, {})
        expect(db.unit.batchRemove).toBeCalledWith([6])
        expect(db.unit.getGroupsWithNoUnits).toBeCalledWith(9, {})
        expect(db.group.batchRemove).toBeCalledWith([11], {})
      })
    })
  })
})