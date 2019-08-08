import _ from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 5IXXXX
class treatmentRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5I0000')
  repository = () => this.rep
  @setErrorCode('5I2000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM treatment WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5I3000')
  findAllByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT * FROM treatment WHERE experiment_id=$1 ORDER BY id ASC', experimentId)

  @setErrorCode('5I4000')
  batchCreate = (treatments, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['treatment_number', 'notes', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date',
      { name: 'control_types', cast: 'text[]' }],
      { table: 'treatment' },
    )
    const values = treatments.map(t => ({
      treatment_number: t.treatmentNumber,
      notes: t.notes,
      experiment_id: t.experimentId,
      control_types: t.controlTypes || [],
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5I5000')
  batchUpdate = (treatments, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'treatment_number', 'notes', 'experiment_id', 'modified_user_id', 'modified_date',
        { name: 'control_types', cast: 'text[]' }],
      { table: 'treatment' },
    )
    const data = treatments.map(t => ({
      id: t.id,
      treatment_number: t.treatmentNumber,
      notes: t.notes,
      experiment_id: t.experimentId,
      control_types: t.controlTypes || [],
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('5I6000')
  getDistinctExperimentIds = (ids, tx = this.rep) => tx.any('SELECT DISTINCT(experiment_id) FROM treatment WHERE id IN ($1:csv)', [ids])

  @setErrorCode('5I7000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM treatment WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('5I8000')
  removeByExperimentId = (experimentId, tx = this.rep) => tx.any('DELETE FROM treatment WHERE experiment_id = $1 RETURNING id', experimentId)

  @setErrorCode('5I9000')
  findByBusinessKey = (keys, tx = this.rep) => tx.oneOrNone('SELECT * FROM treatment WHERE experiment_id=$1 and treatment_number=$2', keys)

  @setErrorCode('5IA000')
  batchFindAllTreatmentLevelDetails = (treatmentIds, tx = this.rep) => tx.any('SELECT ce.treatment_id, fl.value, f.name FROM factor_level fl INNER JOIN combination_element ce ON fl.id = ce.factor_level_id INNER JOIN factor f ON fl.factor_id = f.id WHERE ce.treatment_id IN ($1:csv)', [treatmentIds])

  @setErrorCode('5IB000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      treatment_number: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, treatment_number, id) AS (VALUES ${this.pgp.helpers.values(values, ['experiment_id', 'treatment_number', 'id'])}) select t.experiment_id, t.treatment_number from public.treatment t inner join d on t.experiment_id = CAST(d.experiment_id as integer) and t.treatment_number = d.treatment_number and (d.id is null or t.id != CAST(d.id as integer))`
    return tx.any(query)
  }

  @setErrorCode('5IC000')
  batchFindAllByExperimentId = (experimentIds, tx = this.rep) => {
    return tx.any('SELECT * FROM treatment WHERE experiment_id IN ($1:csv)', [experimentIds])
      .then(data => {
        const dataByExperimentId = _.groupBy(data, 'experiment_id')
        return _.map(experimentIds, experimentId => dataByExperimentId[experimentId] || [])
      })
  }

  // TODO check the block in these query
  batchFindAllBySetId = (setIds, tx = this.rep) => {
    return tx.any('SELECT es.set_id, t.* FROM (SELECT DISTINCT la.set_id, la.experiment_id, la.block FROM public.location_association la WHERE la.set_id IN ($1:csv)) es INNER JOIN treatment t on es.experiment_id = t.experiment_id AND ((t.in_all_blocks IS TRUE) OR (es.block IS NOT DISTINCT FROM t.block))', [setIds])
      .then(data => {
        const dataBySetId = _.groupBy(data, 'set_id')
        return _.compact(_.flatMap(setIds, setId =>
          _.map(dataBySetId[setId] || [], treatment => _.omit(treatment, ['set_id']))))
      })
  }
}

module.exports = (rep, pgp) => new treatmentRepo(rep, pgp)
