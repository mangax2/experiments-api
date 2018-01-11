import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5KXXXX
class unitSpecificationDetailRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }
  
  @setErrorCode('5K0000')
  repository = () => this.rep

  @setErrorCode('5K1000')
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT * FROM unit_spec_detail WHERE id = $1', id)

  @setErrorCode('5K2000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM unit_spec_detail WHERE id IN ($1:csv)', [ids])

  @setErrorCode('5K3000')
  findAllByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT * FROM unit_spec_detail WHERE experiment_id=$1 ORDER BY id ASC', experimentId)

  @setErrorCode('5K4000')
  batchCreate = (unitSpecificationDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['value', 'uom_id', 'ref_unit_spec_id', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'unit_spec_detail' },
    )

    const values = unitSpecificationDetails.map(detail => ({
      value: detail.value,
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

  @setErrorCode('5K5000')
  batchUpdate = (unitSpecificationDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['id', 'value', { name: 'uom_id', cast: 'int' }, 'ref_unit_spec_id', 'experiment_id', 'modified_user_id', 'modified_date'],
      { table: 'unit_spec_detail' },
    )

    const data = unitSpecificationDetails.map(usd => ({
      id: usd.id,
      value: usd.value,
      uom_id: usd.uomId,
      ref_unit_spec_id: usd.refUnitSpecId,
      experiment_id: usd.experimentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('5K6000')
  remove = (id, tx = this.rep) => tx.oneOrNone('DELETE FROM unit_spec_detail WHERE id=$1 RETURNING id', id)

  @setErrorCode('5K7000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM unit_spec_detail WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('5K8000')
  removeByExperimentId = (experimentId, tx = this.rep) => tx.any('DELETE FROM unit_spec_detail WHERE experiment_id = $1 RETURNING id', experimentId)

  @setErrorCode('5K9000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      ref_unit_spec_id: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, ref_unit_spec_id, id) AS (VALUES ${this.pgp.helpers.values(values, ['experiment_id', 'ref_unit_spec_id', 'id'])}) select entity.experiment_id, entity.ref_unit_spec_id from public.unit_spec_detail entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) AND entity.ref_unit_spec_id = CAST(d.ref_unit_spec_id as integer) AND (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  }
}

module.exports = (rep, pgp) => new unitSpecificationDetailRepo(rep, pgp)
