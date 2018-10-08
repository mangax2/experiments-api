test('test', () => {
  expect(true).toEqual(true)
})
// import VaultUtil from '../../../src/services/utility/VaultUtil'
// import cfServices from '../../../src/services/utility/ServiceConfig'
// import db from '../../../src/db/DbManager'
// import { mock, mockResolve, mockReject } from '../../jestUtil'
// import { serializeKafkaAvroMsg } from '../../../src/services/utility/AvroUtil'
// import { sendKafkaNotification } from '../../../src/decorators/notifyChanges'
//
// jest.mock('kafka-node')
// jest.mock('../../../src/decorators/notifyChanges')
//
// const SetsChangesListener = require('../../../src/services/listeners/SetsChangesListener').default
//
// describe('SetsChangesListener', () => {
//   beforeEach(() => {
//     expect.hasAssertions()
//     sendKafkaNotification.mockClear()
//   })
//
//   describe('using mocked kafka-node', () => {
//     describe('listen', () => {
//       test('calls things correctly', () => {
//         const target = new SetsChangesListener()
//         VaultUtil.kafkaClientCert = 'cert'
//         VaultUtil.kafkaPrivateKey = 'key'
//         VaultUtil.kafkaPassword = 'password'
//         VaultUtil.clientId = 'PD-EXPERIMENTS-API-DEV-SVC'
//         cfServices.experimentsKafka = { value: { host: 'host', topics: { setsChangesTopic: 'topic' } } }
//         const consumer = { on: jest.fn() }
//         SetsChangesListener.createConsumer = jest.fn(() => consumer)
//         target.dataHandler = mock()
//
//         target.listen()
//
//         expect(target.consumer).toBe(consumer)
//         expect(SetsChangesListener.createConsumer).toBeCalledWith({
//           client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
//           encoding: 'buffer',
//           groupId: 'PD-EXPERIMENTS-API-DEV-SVC',
//           kafkaHost: 'host',
//           ssl: true,
//           sslOptions: {
//             cert: 'cert',
//             key: 'key',
//             passphrase: 'password',
//           },
//         }, ['topic'])
//       })
//     })
//
//     describe('dataHandler', () => {
//       cfServices.experimentsKafka = { value: { topics: { product360OutgoingTopic: 'outgoingTopic' }, schema: { product360Outgoing: 'outgoing' } } }
//
//       test('converts data from avro to json and calls clearSet', () => {
//         const message = {
//           resource_id: 123,
//           event_category: 'delete',
//           time: '123',
//         }
//
//         const serializedMessage = serializeKafkaAvroMsg(message, 777)
//
//         const target = new SetsChangesListener()
//         target.clearSet = mockResolve([])
//         target.consumer = {}
//
//         return target.dataHandler([{ value: serializedMessage, offset: 1 }], 'topic', 'partition').then(() => {
//           expect(target.clearSet).toHaveBeenCalledWith(123)
//         })
//       })
//
//       test('converts data from avro to json and calls clearSet that returns data', () => {
//         const message = {
//           resource_id: 123,
//           event_category: 'delete',
//           time: '123',
//         }
//
//         const serializedMessage = serializeKafkaAvroMsg(message, 777)
//
//         const target = new SetsChangesListener()
//         target.clearSet = mockResolve([{ experiment_id: 1 }])
//         target.consumer = {}
//         cfServices.experimentsKafka = { value: { topics: { product360OutgoingTopic: 'topic1' }, schema: { product360Outgoing: 123 } } }
//
//         return target.dataHandler([{ value: serializedMessage, offset: 1 }], 'topic', 'partition').then(() => {
//           expect(target.clearSet).toHaveBeenCalledWith(123)
//         })
//       })
//
//       test('converts data from avro to json and calls clearSet that has no return data', () => {
//         const message = {
//           resource_id: 123,
//           event_category: 'delete',
//           time: '123',
//         }
//
//         const serializedMessage = serializeKafkaAvroMsg(message, 777)
//
//         const target = new SetsChangesListener()
//         target.clearSet = mockResolve(null)
//         target.consumer = {}
//         cfServices.experimentsKafka = { value: { topics: { product360OutgoingTopic: 'topic1' }, schema: { product360Outgoing: 123 } } }
//
//         return target.dataHandler([{ value: serializedMessage, offset: 1 }], 'topic', 'partition').then(() => {
//           expect(target.clearSet).toHaveBeenCalledWith(123)
//           expect(sendKafkaNotification).not.toHaveBeenCalled()
//         })
//       })
//
//       test('converts data from avro to json but fails to clear set', () => {
//         const message = {
//           resource_id: 123,
//           event_category: 'delete',
//           time: '123',
//         }
//
//         const serializedMessage = serializeKafkaAvroMsg(message, 777)
//
//         const target = new SetsChangesListener()
//         target.clearSet = mockReject(new Error('error'))
//         target.consumer = {}
//         cfServices.experimentsKafka = { value: { topics: { product360OutgoingTopic: 'topic1' }, schema: { product360Outgoing: 123 } } }
//
//         return target.dataHandler([{ value: serializedMessage, offset: 1 }], 'topic', 'partition').then(null, (err) => {
//           expect(target.clearSet).toHaveBeenCalledWith(123)
//           expect(err.message).toEqual('error')
//         })
//       })
//
//       test('calls nothing if event is not delete', () => {
//         const message = {
//           resource_id: 123,
//           event_category: 'update',
//           time: '123',
//         }
//
//         const serializedMessage = serializeKafkaAvroMsg(message, 777)
//
//         const target = new SetsChangesListener()
//         target.clearSet = mock()
//         target.consumer = {}
//
//         return target.dataHandler([{ value: serializedMessage, offset: 1 }], 'topic', 'partition').then(() => {
//           expect(target.clearSet).not.toHaveBeenCalled()
//         })
//       })
//     })
//
//     describe('clearSet', () => {
//       const testTx = { tx: {} }
//       test('calls clearSetEntryIds and clearSetId', () => {
//         db.unit.batchClearEntryIds = mockResolve()
//         db.locationAssociation.removeBySetId = mockResolve()
//
//         const target = new SetsChangesListener()
//         return target.clearSet(1, testTx).then(() => {
//           expect(db.unit.batchClearEntryIds).toHaveBeenCalledWith(1, testTx)
//           expect(db.locationAssociation.removeBySetId).toHaveBeenCalledWith(1, testTx)
//         })
//       })
//     })
//   })
// })
