import Kafka from 'no-kafka'
import ManageRepsAndUnitsListener from '../../../src/services/listeners/ManageRepsAndUnitsListener'
import VaultUtil from '../../../src/services/utility/VaultUtil'
import cfServices from '../../../src/services/utility/ServiceConfig'
import KafkaProducer from '../../../src/services/kafka/KafkaProducer'
import db from '../../../src/db/DbManager'
import { kafkaProducerMocker } from '../../jestUtil'

describe('ManageRepsAndUnitsListener', () => {
  kafkaProducerMocker()

  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('createConsumer', () => {
    test('creates an object of type Kafka.GroupConsumer', () => {
      expect(ManageRepsAndUnitsListener.createConsumer() instanceof Kafka.GroupConsumer).toBe(true)
    })
  })

  describe('sendResponseMessage', () => {
    test('sends a success if isSuccess', () => {
      KafkaProducer.publish = jest.fn()
      cfServices.experimentsKafka = {
        value: {
          topics:
            { repPackingResultTopic: 'topic', product360Outgoing: 'prod360' },
          schema: { product360Outgoing: 1 },
        },
      }

      ManageRepsAndUnitsListener.sendResponseMessage(555, true)

      expect(KafkaProducer.publish).toBeCalledWith({
        topic: 'topic',
        message: { setId: 555, result: 'SUCCESS' },
      })
    })

    test('sends a failure if not isSuccess', () => {
      KafkaProducer.publish = jest.fn()
      cfServices.experimentsKafka = {
        value: {
          topics:
            { repPackingResultTopic: 'topic', product360Outgoing: 'prod360' },
          schema: { product360Outgoing: 1 },
        },
      }

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
        groupId: 'PD-EXPERIMENTS-API-DEV-SVC',
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
      cfServices.experimentsKafka = {
        value: {
          topics:
            { repPackingResultTopic: 'topic', product360Outgoing: 'prod360' },
          schema: { product360Outgoing: 1 },
        },
      }
      const message = { setId: 5, entryChanges: [] }
      db.locationAssociation = { findBySetId: jest.fn(() => Promise.resolve({ experiment_id: 5, location: 7 })) }
      db.unit = { batchFindAllByExperimentIdAndLocation: jest.fn(() => Promise.resolve('unitsFromDb')) }
      target.getDbActions = jest.fn(() => ({
        unitsToBeCreated: 'create', unitsToBeDeleted: 'delete', unitsToBeUpdated: 'update',
      }))
      target.saveToDb = jest.fn(() => Promise.resolve())
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).then(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(db.unit.batchFindAllByExperimentIdAndLocation).toBeCalledWith(5, 7, testTx)
        expect(target.getDbActions).toBeCalledWith([], 'unitsFromDb', 7)
        expect(target.saveToDb).toBeCalledWith('create', 'update', 'delete', testTx)
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, true)
      })
    })

    test('publishes a failure when on error', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5, entryChanges: [] }
      db.locationAssociation = { findBySetId: jest.fn(() => Promise.resolve({ experiment_id: 5, location: 7 })) }
      db.unit = { batchFindAllByExperimentIdAndLocation: jest.fn(() => Promise.resolve('unitsFromDb')) }
      target.getDbActions = jest.fn(() => ({
        unitsToBeCreated: 'create', unitsToBeDeleted: 'delete', unitsToBeUpdated: 'update',
      }))
      target.saveToDb = jest.fn(() => Promise.reject(new Error('test')))
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(db.unit.batchFindAllByExperimentIdAndLocation).toBeCalledWith(5, 7, testTx)
        expect(target.getDbActions).toBeCalledWith([], 'unitsFromDb', 7)
        expect(target.saveToDb).toBeCalledWith('create', 'update', 'delete', testTx)
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
      })
    })

    test('publishes a failure when on bad format', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5 }
      db.locationAssociation = { findBySetId: jest.fn() }
      db.unit = { batchFindAllByExperimentIdAndLocation: jest.fn() }
      target.getDbActions = jest.fn()
      target.saveToDb = jest.fn()
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
        expect(db.locationAssociation.findBySetId).not.toBeCalled()
        expect(db.unit.batchFindAllByExperimentIdAndLocation).not.toBeCalled()
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
      db.locationAssociation = { findBySetId: jest.fn(() => Promise.resolve()) }
      db.unit = { batchFindAllByExperimentIdAndLocation: jest.fn(() => Promise.resolve('unitsFromDb')) }
      target.getDbActions = jest.fn()
      target.saveToDb = jest.fn()
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
        expect(db.locationAssociation.findBySetId).toBeCalled()
        expect(db.unit.batchFindAllByExperimentIdAndLocation).not.toBeCalled()
        expect(target.getDbActions).not.toBeCalled()
        expect(target.saveToDb).not.toBeCalled()
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
        expect(err.status).toBe(404)
        expect(err.code).toBe('Not Found')
        expect(err.message).toBe('No experiment found for setId "5".')
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
        rep: 1,
        setEntryId: 233,
        treatmentId: 8,
        location: 1,
      }, {
        id: 66,
        rep: 1,
        setEntryId: 234,
        treatmentId: 7,
        location: 1,
      }, {
        id: 77,
        rep: 1,
        setEntryId: 235,
        treatmentId: 9,
        location: 1,
      }]

      const target = new ManageRepsAndUnitsListener()

      const result = target.getDbActions(unitsFromMessage, unitsFromDb, 1)

      expect(result).toEqual({
        unitsToBeCreated: [{
          rep: 1,
          setEntryId: 236,
          treatmentId: 9,
          location: 1,
        }, {
          rep: 2,
          setEntryId: 237,
          treatmentId: 7,
          location: 1,
        }],
        unitsToBeUpdated: [{
          id: 77,
          rep: 1,
          setEntryId: 235,
          treatmentId: 8,
          location: 1,
        }],
        unitsToBeDeleted: [55],
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
      }

      return target.saveToDb([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], [{ id: 5 }], [6], {}).then(() => {
        expect(db.unit.batchCreate).toBeCalledWith([{ id: 3, groupId: 7 }, { id: 4, groupId: null }], context, {})
        expect(db.unit.batchUpdate).toBeCalledWith([{ id: 5 }], context, {})
        expect(db.unit.batchRemove).toBeCalledWith([6])
      })
    })

    test('calls everything correctly when values are not present', () => {
      const target = new ManageRepsAndUnitsListener()
      db.unit = {
        batchCreate: jest.fn(() => Promise.resolve()),
        batchUpdate: jest.fn(() => Promise.resolve()),
        batchRemove: jest.fn(() => Promise.resolve()),
      }

      return target.saveToDb(9, [], [], [], [], {}).then(() => {
        expect(db.unit.batchCreate).not.toBeCalled()
        expect(db.unit.batchUpdate).not.toBeCalled()
        expect(db.unit.batchRemove).not.toBeCalled()
      })
    })
  })
})
