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
      target.experimentalUnitService = {
        mergeSetEntriesToUnits: jest.fn(() => Promise.resolve()),
      }
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).then(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(target.experimentalUnitService.mergeSetEntriesToUnits).toBeCalledWith(5, [], 7, { userId: 'REP_PACKING' }, testTx)
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, true)
      })
    })

    test('publishes a failure when on error', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5, entryChanges: [] }
      db.locationAssociation = { findBySetId: jest.fn(() => Promise.resolve({ experiment_id: 5, location: 7 })) }
      target.experimentalUnitService = {
        mergeSetEntriesToUnits: jest.fn(() => Promise.reject(new Error('test'))),
      }
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch(() => {
        expect(db.locationAssociation.findBySetId).toBeCalledWith(5, testTx)
        expect(target.experimentalUnitService.mergeSetEntriesToUnits).toBeCalledWith(5, [], 7, { userId: 'REP_PACKING' }, testTx)
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
      })
    })

    test('publishes a failure when on bad format', () => {
      const target = new ManageRepsAndUnitsListener()
      const message = { setId: 5 }
      db.locationAssociation = { findBySetId: jest.fn() }
      target.experimentalUnitService = {
        mergeSetEntriesToUnits: jest.fn(() => Promise.resolve()),
      }
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
        expect(db.locationAssociation.findBySetId).not.toBeCalled()
        expect(target.experimentalUnitService.mergeSetEntriesToUnits).not.toBeCalled()
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
      target.experimentalUnitService = {
        mergeSetEntriesToUnits: jest.fn(() => Promise.resolve()),
      }
      ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
      const testTx = { tx: {} }

      return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
        expect(db.locationAssociation.findBySetId).toBeCalled()
        expect(target.experimentalUnitService.mergeSetEntriesToUnits).not.toBeCalled()
        expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
        expect(err.status).toBe(404)
        expect(err.code).toBe('Not Found')
        expect(err.message).toBe('No experiment found for setId "5".')
      })
    })
  })
})
