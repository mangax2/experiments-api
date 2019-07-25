const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5TXXXX
class treatmentBlockRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5T0000')
  repository = () => this.rep

  @setErrorCode('5T2000')
  batchFindByTreatmentIds = (treatmentIds, tx = this.rep) => {
    return tx.any('SELECT * FROM treatment_block WHERE treatment_id IN ($1:csv)', [treatmentIds])
  }

  @setErrorCode('5T3000')
  batchFindByBlockIds = (blockIds, tx = this.rep) => {
    return tx.any('SELECT * FROM treatment_block WHERE block_id IN ($1:csv)', [blockIds])
  }

  @setErrorCode('5T4000')
  batchCreate = (treatmentBlocks, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['treatment_id', 'block_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'treatment_block' },
    )
    const values = treatmentBlocks.map(tb => ({
      treatment_id: tb.treatmentId,
      block_id: tb.blockId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5T5000')
  batchUpdate = (treatmentBlocks, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'treatment_id', 'block_id', 'modified_user_id', 'modified_date'],
      { table: 'treatment_block' },
    )
    const data = treatmentBlocks.map(tb => ({
      id: tb.id,
      treatment_id: tb.treatmentId,
      block_id: tb.blockId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }
}

module.exports = (rep, pgp) => new treatmentBlockRepo(rep, pgp)
