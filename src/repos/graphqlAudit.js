const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5RXXXX
class graphqlAuditRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5R0000')
  repository = () => this.rep

  @setErrorCode('5R1000')
  batchCreate = (audits, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'raw',
        'request_time',
        'client_id',
        'user_id',
      ],
      {table: { table: 'graphql_audit', schema: 'audit'} })
    const values = audits.map(audit => ({
      raw: audit.query,
      request_time: audit.requestTime,
      client_id: audit.clientId,
      user_id: audit.userId,
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet)}`
    return tx.none(query)
  }
}

module.exports = (rep, pgp) => new graphqlAuditRepo(rep, pgp)
