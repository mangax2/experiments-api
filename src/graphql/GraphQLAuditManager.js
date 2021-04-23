import db from '../db/DbManager'

const FIVE_MINUTES_IN_MS = 300000

class GraphQLAuditManager {
  queue = []

  intervalHandle = null

  logRequest = (query, userId, clientId) => {
    console.info(`Experiments API GraphQL request: "${query}"`)
    this.queue.push({
      query,
      userId,
      clientId,
      requestTime: new Date().toISOString(),
    })
  }

  saveLogs = async () => {
    if (this.queue.length > 0) {
      const queriesToLog = this.queue
      this.queue = []
      try {
        await db.graphqlAudit.batchCreate(queriesToLog)
      } catch (err) {
        console.error('An error occurred while saving GraphQL audit data', err)
        this.queue = [
          ...this.queue,
          ...queriesToLog,
        ]
      }
    }
  }

  startInterval = () => {
    this.intervalHandle = setInterval(() => this.saveLogs(), FIVE_MINUTES_IN_MS)
  }

  // TODO: Figure out a way to call this when the application is shutting down.
  endInterval = async () => {
    clearInterval(this.intervalHandle)
    this.intervalHandle = null
    await this.saveLogs()
  }
}

export default new GraphQLAuditManager()
