import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 52XXXX
class designSpecificationDetailRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('520000')
  repository = () => this.rep

  @setErrorCode('521000')
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT * FROM design_spec_detail WHERE id = $1', id)

  @setErrorCode('522000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM design_spec_detail WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('523000')
  findAllByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT * FROM design_spec_detail WHERE experiment_id=$1 ORDER BY id ASC', experimentId)

  @setErrorCode('524000')
  batchCreate = (designSpecificationDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['value', 'ref_design_spec_id', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'design_spec_detail' },
    )

    const values = designSpecificationDetails.map(detail => ({
      value: detail.value,
      ref_design_spec_id: detail.refDesignSpecId,
      experiment_id: detail.experimentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('525000')
  batchUpdate = (designSpecificationDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['id', 'value', 'ref_design_spec_id', 'experiment_id', 'modified_user_id', 'modified_date'],
      { table: 'design_spec_detail' },
    )

    const data = designSpecificationDetails.map(dsd => ({
      id: dsd.id,
      value: dsd.value,
      ref_design_spec_id: dsd.refDesignSpecId,
      experiment_id: dsd.experimentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('526000')
  remove = (id, tx = this.rep) => tx.oneOrNone('DELETE FROM design_spec_detail WHERE id=$1 RETURNING id', id)

  @setErrorCode('527000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM design_spec_detail WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('528000')
  removeByExperimentId = (experimentId, tx = this.rep) => tx.any('DELETE FROM design_spec_detail WHERE experiment_id = $1 RETURNING id', experimentId)

  @setErrorCode('529000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      ref_design_spec_id: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, ref_design_spec_id, id) AS (VALUES ${this.pgp.helpers.values(values, ['experiment_id', 'ref_design_spec_id', 'id'])}) select entity.experiment_id, entity.ref_design_spec_id from public.design_spec_detail entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) AND entity.ref_design_spec_id = CAST(d.ref_design_spec_id as integer) AND (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  }

  @setErrorCode('52A000')
  syncDesignSpecificationDetails = (experimentId, upsertDetails, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['value', 'ref_design_spec_id', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'design_spec_detail' },
    )

    const data = upsertDetails.map(dsd => ({
      value: dsd.value,
      ref_design_spec_id: dsd.refDesignSpecId,
      experiment_id: experimentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${this.pgp.helpers.insert(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} ON CONFLICT ON CONSTRAINT design_spec_detail_ak_1 DO UPDATE SET value = EXCLUDED.value, modified_user_id = EXCLUDED.modified_user_id, modified_date=EXCLUDED.modified_date`

    return tx.query(query)
  }

  @setErrorCode('52B000')
  batchFindAllByExperimentId = (experimentIds, tx = this.rep) => {
    return tx.any('SELECT * FROM design_spec_detail WHERE experiment_id IN ($1:csv)', [experimentIds])
      .then(data => {
        const dataByExperimentId = _.groupBy(data, 'experiment_id')
        return _.map(experimentIds, experimentId => dataByExperimentId[experimentId])
      })
  }
}

module.exports = (rep, pgp) => new designSpecificationDetailRepo(rep, pgp)
