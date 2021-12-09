import VaultUtil from '../../../src/services/utility/VaultUtil'
import kafkaConfig from '../../../src/config/kafkaConfig'
import { mock, mockResolve, mockReject } from '../../jestUtil'
import { dbWrite } from '../../../src/db/DbManager'
import SetEntriesChangesListener from '../../../src/services/listeners/SetEntriesChangesListener'

describe('SetEntriesChangesListener', () => {
  describe('listen', () => {
    test('check createConsumer is called with right parameters', () => {
      const target = new SetEntriesChangesListener()
      VaultUtil.kafkaClientCert = 'cert'
      VaultUtil.kafkaPrivateKey = 'key'
      VaultUtil.kafkaPassword = 'password'
      VaultUtil.clientId = 'PD-EXPERIMENTS-API-DEV-SVC'
      kafkaConfig.host = 'host'
      kafkaConfig.topics = { setEntriesChangesTopic: 'test-topic' }
      const consumer = { on: jest.fn() }
      SetEntriesChangesListener.createConsumer = jest.fn(() => consumer)
      target.dataHandler = mock()

      target.listen()

      expect(target.consumer).toBe(consumer)
      expect(SetEntriesChangesListener.createConsumer).toBeCalledWith({
        client_id: 'PD-EXPERIMENTS-API-DEV-SVC',
        groupId: 'PD-EXPERIMENTS-API-DEV-SVC',
        kafkaHost: 'host',
        ssl: true,
        sslOptions: {
          cert: 'cert',
          key: 'key',
          passphrase: 'password',
        },
      }, ['test-topic'])
    })
  })

  describe('dataHandler', () => {
    test('parse deleted entries and remove unit to entry associations', async () => {
      const entryChange = [
        {
          setId: 1757742, entryIds: [11806124, 11806125], eventType: 'deleted', setTypes: [2],
        },
        {
          setId: 1757742, entryIds: [11806126, 11806127], eventType: 'created', setTypes: [2],
        },
        {
          setId: 1757742, entryIds: [11806128], eventType: 'deleted', setTypes: [2],
        },
        {
          setId: 1757742, eventType: 'deleted', setTypes: [2],
        },
      ]

      const target = new SetEntriesChangesListener()
      dbWrite.unit.batchClearEntryIds = mockResolve()

      const message = { value: { toString: mock(JSON.stringify(entryChange)) }, offset: 3 }
      await target.dataHandler([message])
      expect(dbWrite.unit.batchClearEntryIds).toHaveBeenCalledWith([11806124, 11806125, 11806128])
    })
  })

  test('log an error when failed to update to DB ', async () => {
    const entryChange = [
      {
        setId: 1757742, entryIds: [11806124, 11806125], eventType: 'deleted', setTypes: [2],
      },
    ]

    const target = new SetEntriesChangesListener()
    dbWrite.unit.batchClearEntryIds = mockReject(new Error('error'))

    const message = { value: { toString: mock(JSON.stringify(entryChange)) }, offset: 3 }
    try {
      await target.dataHandler([message])
      expect(dbWrite.unit.batchClearEntryIds).toHaveBeenCalledWith([11806124, 11806125])
    } catch (err) {
      expect(err.message).toEqual('error')
    }
  })
})
