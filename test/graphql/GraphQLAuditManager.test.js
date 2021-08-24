import GraphQLAuditManager from '../../src/graphql/GraphQLAuditManager'
import { dbWrite } from '../../src/db/DbManager'
import { mockReject, mockResolve } from '../jestUtil'

describe('GraphQLAuditManager', () => {
  describe('logRequest', () => {
    test('adds the request to the queue', () => {
      GraphQLAuditManager.queue = []

      GraphQLAuditManager.logRequest('query', 'userId', 'client')

      expect(GraphQLAuditManager.queue.length).toEqual(1)
      expect(GraphQLAuditManager.queue[0].query).toEqual('query')
      expect(GraphQLAuditManager.queue[0].userId).toEqual('userId')
      expect(GraphQLAuditManager.queue[0].clientId).toEqual('client')
    })
  })

  describe('saveLogs', () => {
    test('calls batchCreate with the queries and clears the queue on success', async () => {
      const queries = [{ query: 'query 1' }, { query: 'query 2' }]
      dbWrite.graphqlAudit.batchCreate = mockResolve()
      GraphQLAuditManager.queue = queries

      await GraphQLAuditManager.saveLogs()

      expect(dbWrite.graphqlAudit.batchCreate).toHaveBeenCalledWith(queries)
      expect(GraphQLAuditManager.queue).toEqual([])
    })

    test('calls batchCreate with the queries and does not clear the queue on failure', async () => {
      const queries = [{ query: 'query 1' }, { query: 'query 2' }]
      dbWrite.graphqlAudit.batchCreate = mockReject()
      GraphQLAuditManager.queue = queries

      await GraphQLAuditManager.saveLogs()

      expect(dbWrite.graphqlAudit.batchCreate).toHaveBeenCalledWith(queries)
      expect(GraphQLAuditManager.queue).toEqual(queries)
    })

    test('does not call batchCreate when no queries to save', async () => {
      dbWrite.graphqlAudit.batchCreate = mockResolve()
      GraphQLAuditManager.queue = []

      await GraphQLAuditManager.saveLogs()

      expect(dbWrite.graphqlAudit.batchCreate).not.toHaveBeenCalled()
    })
  })

  describe('startInterval', () => {
    afterEach(() => {
      clearInterval(GraphQLAuditManager.intervalHandle)
      GraphQLAuditManager.intervalHandle = null
    })

    test('sets the intervalHandle', () => {
      GraphQLAuditManager.startInterval()

      expect(GraphQLAuditManager.intervalHandle).not.toBe(null)
    })
  })

  describe('endInterval', () => {
    let originalSaveLogs

    beforeEach(() => {
      originalSaveLogs = GraphQLAuditManager.saveLogs
    })

    afterEach(() => {
      GraphQLAuditManager.saveLogs = originalSaveLogs
    })

    test('clears the interval and calls saveLogs', async () => {
      GraphQLAuditManager.saveLogs = mockResolve()
      GraphQLAuditManager.intervalHandle = 12345

      await GraphQLAuditManager.endInterval()

      expect(GraphQLAuditManager.intervalHandle).toBe(null)
      expect(GraphQLAuditManager.saveLogs).toHaveBeenCalled()
    })
  })
})
