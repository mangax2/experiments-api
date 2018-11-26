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
  batchCreate = (audits, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'raw',
        'request_time:raw',
        'client_id',
        'user_id',
      ],
      {table: { table: 'graphql_audit', schema: 'audit'} })
    const values = audits.map(comment => ({
      raw: comment.raw,
      request_time: 'CURRENT_TIMESTAMP',
      client_id: context.clientId,
      user_id: context.userId,
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet)}`
    console.log(query)
    return tx.none(query)
  }
}

module.exports = (rep, pgp) => new graphqlAuditRepo(rep, pgp)
