import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5LXXXX
class unitSpecificationDetailRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5L0000')
  repository = () => this.rep
  @setErrorCode('5L2000')
  batchFind = (ids) => this.rep.any('SELECT * FROM unit_spec_detail WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5L3000')
  findAllByExperimentId = (experimentId) => this.rep.any('SELECT * FROM unit_spec_detail WHERE experiment_id=$1 ORDER BY id ASC', experimentId)

  @setErrorCode('5L4000')
  batchCreate = (unitSpecificationDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['value', 'uom_code', 'uom_id', 'ref_unit_spec_id', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'unit_spec_detail' },
    )

    const values = unitSpecificationDetails.map(detail => ({
      value: detail.value,
      uom_code: detail.uomCode,
      uom_id: detail.uomId,
      ref_unit_spec_id: detail.refUnitSpecId,
      experiment_id: detail.experimentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5L5000')
  batchUpdate = (unitSpecificationDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['id', 'value', 'uom_code', { name: 'uom_id', cast: 'int' }, 'ref_unit_spec_id', 'experiment_id', 'modified_user_id', 'modified_date'],
      { table: 'unit_spec_detail' },
    )

    const data = unitSpecificationDetails.map(usd => ({
      id: usd.id,
      value: usd.value,
      uom_code: usd.uomCode,
      uom_id: usd.uomId,
      ref_unit_spec_id: usd.refUnitSpecId,
      experiment_id: usd.experimentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('5L6000')
  remove = (id, tx = this.rep) => tx.oneOrNone('DELETE FROM unit_spec_detail WHERE id=$1 RETURNING id', id)

  @setErrorCode('5L7000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM unit_spec_detail WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('5L8000')
  removeByExperimentId = (experimentId, tx = this.rep) => tx.any('DELETE FROM unit_spec_detail WHERE experiment_id = $1 RETURNING id', experimentId)

  @setErrorCode('5L9000')
  batchFindByBusinessKey = (batchKeys) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      ref_unit_spec_id: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, ref_unit_spec_id, id) AS (VALUES ${this.pgp.helpers.values(values, ['experiment_id', 'ref_unit_spec_id', 'id'])}) select entity.experiment_id, entity.ref_unit_spec_id from public.unit_spec_detail entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) AND entity.ref_unit_spec_id = CAST(d.ref_unit_spec_id as integer) AND (d.id is null or entity.id != CAST(d.id as integer))`
    return this.rep.any(query)
  }

  @setErrorCode('5LA000')
  batchFindAllByExperimentId = (experimentIds) => {
    return this.rep.any('SELECT * FROM unit_spec_detail WHERE experiment_id IN ($1:csv)', [experimentIds])
      .then(data => {
        const dataByExperimentId = _.groupBy(data, 'experiment_id')
        return _.map(experimentIds, experimentId => dataByExperimentId[experimentId] || [])
      })
  }
}

module.exports = (rep, pgp) => new unitSpecificationDetailRepo(rep, pgp)
