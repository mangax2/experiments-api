import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5SXXXX
class blockRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5S0000')
  repository = () => this.rep

  @setErrorCode('5S1000')
  findByExperimentId = (experimentId) => this.rep.any('SELECT * FROM block WHERE experiment_id = $1', experimentId)

  @setErrorCode('5S2000')
  batchFind = (ids) => this.rep.any(`SELECT * FROM block WHERE id IN ($1:csv) ORDER BY id asc`, [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5S5000')
  findByBlockId = (id) => this.rep.oneOrNone('SELECT * FROM block WHERE id = $1', id)

  @setErrorCode('5S3000')
  batchCreateByExperimentId = (experimentId, blockNames, context, tx = this.rep) => {
    if (_.isEmpty(blockNames)) {
      return Promise.resolve([])
    }

    const columnSet = new this.pgp.helpers.ColumnSet(
      ['experiment_id', 'name', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'block' },
    )
    const values = blockNames.map(name => ({
      name: name,
      experiment_id: experimentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5S4000')
  batchRemove = (ids, tx = this.rep) => {
    if (_.isEmpty(ids)) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM block WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('5S5000')
  batchUpdate = (blocks, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        '?id',
        'name',
        'modified_user_id',
        'modified_date:raw',
      ],
      {table: 'block'})
    const values = blocks.map(block => ({
      name: block.name,
      id: block.id,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(values, columnSet)} WHERE v.id = t.id`
    return tx.query(query)
  }
}

module.exports = (rep, pgp) => new blockRepo(rep, pgp)
