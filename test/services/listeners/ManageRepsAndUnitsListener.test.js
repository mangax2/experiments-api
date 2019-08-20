import VaultUtil from '../../../src/services/utility/VaultUtil'
import cfServices from '../../../src/services/utility/ServiceConfig'
import SetEntryRemovalService from '../../../src/services/prometheus/SetEntryRemovalService'
import db from '../../../src/db/DbManager'
import { mockResolve } from '../../jestUtil'

jest.mock('kafka-node')

const ManageRepsAndUnitsListener = require('../../../src/services/listeners/ManageRepsAndUnitsListener').default
const KafkaProducer = require('../../../src/services/kafka/KafkaProducer').default

describe('ManageRepsAndUnitsListener', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('using mocked kafka-node', () => {
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
        const consumer = { on: jest.fn() }
        ManageRepsAndUnitsListener.createConsumer = jest.fn(() => consumer)

        target.listen()

        expect(target.consumer).toBe(consumer)
        expect(ManageRepsAndUnitsListener.createConsumer).toBeCalledWith({
          client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
          groupId: 'PD-EXPERIMENTS-API-DEV-SVC',
          kafkaHost: 'host',
          ssl: true,
          sslOptions: {
            cert: 'cert',
            key: 'key',
            passphrase: 'password',
          },
        }, ['topic'])
      })
    })

    describe('dataHandler', () => {
      test('successfully handles adjusting', () => {
        const target = new ManageRepsAndUnitsListener()
        const message = { value: { toString: jest.fn(() => '{ "setId": "1234", "entryChanges": [{ "avail": 0 }, { "id": 9886, "repNumber": 1, "value": 246 }] }') }, offset: 3 }
        const consumer = {}
        target.adjustExperimentWithRepPackChanges = jest.fn(() => Promise.resolve())
        target.consumer = consumer
        SetEntryRemovalService.addWarning = jest.fn()

        return target.dataHandler([message], 'topic', 'partition').then(() => {
          expect(SetEntryRemovalService.addWarning).not.toBeCalled()
          expect(target.adjustExperimentWithRepPackChanges).toBeCalledWith({ setId: '1234', entryChanges: [{ setEntryId: 9886, rep: 1, treatmentId: 246 }] })
        })
      })

      test('swallows errors', () => {
        const target = new ManageRepsAndUnitsListener()
        const message = { value: { toString: jest.fn(() => '{ "setId": "1234", "entryChanges": [{ "avail": 0 }, { "repNumber": 1, "value": 246 }] }') }, offset: 3 }
        const consumer = {}
        target.adjustExperimentWithRepPackChanges = jest.fn(() => Promise.reject())
        target.consumer = consumer
        SetEntryRemovalService.addWarning = jest.fn()

        return target.dataHandler([message], 'topic', 'partition').then(() => {
          expect(SetEntryRemovalService.addWarning).toBeCalled()
          expect(target.adjustExperimentWithRepPackChanges).toBeCalledWith({ setId: '1234', entryChanges: [{ rep: 1, treatmentId: 246 }] })
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
        target.locationAssocWithBlockService = {
          getBySetId: jest.fn(() => Promise.resolve({ experiment_id: 5, location: 7 })),
        }
        target.experimentalUnitService = {
          mergeSetEntriesToUnits: jest.fn(() => Promise.resolve()),
        }
        const treatmentBlocks = [
          { treatment_id: 23, block_id: 3 },
          { treatment_id: 24, block_id: 3 },
          { treatment_id: 25, block_id: 3 },
          { treatment_id: 20, block_id: 3 },
        ]
        db.treatmentBlock.batchFindByBlockIds = mockResolve(treatmentBlocks)
        ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
        const testTx = { tx: {} }

        return target.adjustExperimentWithRepPackChanges(message, testTx).then(() => {
          expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(5, testTx)
          expect(target.experimentalUnitService.mergeSetEntriesToUnits).toBeCalledWith(5, [], 7, treatmentBlocks, { userId: 'REP_PACKING', isRepPacking: true }, testTx)
          expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, true)
        })
      })

      test('publishes a failure when on error', () => {
        const target = new ManageRepsAndUnitsListener()
        const message = { setId: 5, entryChanges: [] }
        target.locationAssocWithBlockService = {
          getBySetId: jest.fn(() => Promise.resolve({ experiment_id: 5, location: 7 })),
        }
        target.experimentalUnitService = {
          mergeSetEntriesToUnits: jest.fn(() => Promise.reject(new Error('test'))),
        }
        const treatmentBlocks = [
          { treatment_id: 23, block_id: 3 },
          { treatment_id: 24, block_id: 3 },
          { treatment_id: 25, block_id: 3 },
          { treatment_id: 20, block_id: 3 },
        ]
        db.treatmentBlock.batchFindByBlockIds = mockResolve(treatmentBlocks)
        ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
        const testTx = { tx: {} }

        return target.adjustExperimentWithRepPackChanges(message, testTx).catch(() => {
          expect(target.locationAssocWithBlockService.getBySetId).toBeCalledWith(5, testTx)
          expect(target.experimentalUnitService.mergeSetEntriesToUnits).toBeCalledWith(5, [], 7, treatmentBlocks, { userId: 'REP_PACKING', isRepPacking: true }, testTx)
          expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
        })
      })

      test('publishes a failure when on bad format', () => {
        const target = new ManageRepsAndUnitsListener()
        const message = { setId: 5 }
        target.locationAssocWithBlockService = {
          getBySetId: jest.fn(),
        }
        target.experimentalUnitService = {
          mergeSetEntriesToUnits: jest.fn(() => Promise.resolve()),
        }
        const treatmentBlocks = [
          { treatment_id: 23, block_id: 3 },
          { treatment_id: 24, block_id: 3 },
          { treatment_id: 25, block_id: 3 },
          { treatment_id: 20, block_id: 3 },
        ]
        db.treatmentBlock.batchFindByBlockIds = mockResolve(treatmentBlocks)
        ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
        const testTx = { tx: {} }

        return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
          expect(target.locationAssocWithBlockService.getBySetId).not.toBeCalled()
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
        target.locationAssocWithBlockService = {
          getBySetId: jest.fn(() => Promise.resolve()),
        }
        target.experimentalUnitService = {
          mergeSetEntriesToUnits: jest.fn(() => Promise.resolve()),
        }
        const treatmentBlocks = [
          { treatment_id: 23, block_id: 3 },
          { treatment_id: 24, block_id: 3 },
          { treatment_id: 25, block_id: 3 },
          { treatment_id: 20, block_id: 3 },
        ]
        db.treatmentBlock.batchFindByBlockIds = mockResolve(treatmentBlocks)
        ManageRepsAndUnitsListener.sendResponseMessage = jest.fn()
        const testTx = { tx: {} }

        return target.adjustExperimentWithRepPackChanges(message, testTx).catch((err) => {
          expect(target.locationAssocWithBlockService.getBySetId).toBeCalled()
          expect(target.experimentalUnitService.mergeSetEntriesToUnits).not.toBeCalled()
          expect(ManageRepsAndUnitsListener.sendResponseMessage).toBeCalledWith(5, false)
          expect(err.status).toBe(404)
          expect(err.code).toBe('Not Found')
          expect(err.message).toBe('No experiment found for setId "5".')
        })
      })
    })
  })
})
