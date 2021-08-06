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
  batchFind = (ids) => this.rep.any('SELECT * FROM treatment WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5I3000')
  findAllByExperimentId = (experimentId) => this.rep.any(`WITH treatment_block_info AS (
  SELECT tb.treatment_id, json_build_object('name', b.name, 'blockId', b.id, 'numPerRep', tb.num_per_rep) AS block_info
  FROM block b
    INNER JOIN treatment_block tb ON b.id = tb.block_id
  WHERE b.experiment_id = $1
), grouped_treatment_block_info AS (
  SELECT treatment_id, json_agg(block_info) AS blocks
  FROM treatment_block_info
  GROUP BY treatment_id
)
SELECT t.*,
  json_array_length(gtbi.blocks) > 1 AS in_all_blocks,
  CASE WHEN json_array_length(gtbi.blocks) = 1 THEN gtbi.blocks -> 0 -> 'name' ELSE NULL END AS block,
  CASE WHEN json_array_length(gtbi.blocks) = 1 THEN gtbi.blocks -> 0 -> 'blockId' ELSE NULL END AS block_id,
  gtbi.blocks
FROM treatment t
INNER JOIN grouped_treatment_block_info gtbi ON t.id = gtbi.treatment_id
WHERE experiment_id = $1
ORDER BY id ASC`, experimentId)

  @setErrorCode('5I4000')
  batchCreate = async (treatments, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'id:raw',
        'treatment_number',
        'notes',
        'experiment_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw',
        { name: 'control_types', cast: 'text[]' }
      ],
      { table: 'temp_insert_treatment' },
    )
    const values = treatments.map(t => ({
      id: 'nextval(pg_get_serial_sequence(\'treatment\', \'id\'))::integer',
      treatment_number: t.treatmentNumber,
      notes: t.notes,
      experiment_id: t.experimentId,
      control_types: t.controlTypes || [],
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query1 = `DROP TABLE IF EXISTS temp_insert_treatment; CREATE TEMP TABLE temp_insert_treatment AS TABLE treatment WITH NO DATA; ${this.pgp.helpers.insert(values, columnSet)};`
    const query2 = "INSERT INTO treatment SELECT * FROM temp_insert_treatment RETURNING id"
    await tx.any(query1)
    return tx.any(query2)
  }

  @setErrorCode('5I5000')
  batchUpdate = async (treatments, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        '?id',
        'treatment_number',
        'notes',
        'experiment_id',
        'modified_user_id',
        'modified_date:raw',
        { name: 'control_types', cast: 'text[]' }
      ],
      { table: 'temp_update_treatment' },
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
    const query1 = `DROP TABLE IF EXISTS temp_update_treatment; CREATE TEMP TABLE temp_update_treatment AS TABLE treatment WITH NO DATA; ${this.pgp.helpers.insert(data, columnSet)};`
    const query2 = `UPDATE treatment
    SET treatment_number = tut.treatment_number, notes = tut.notes, experiment_id = tut.experiment_id, modified_user_id = tut.modified_user_id, modified_date = tut.modified_date, control_types = tut.control_types
    FROM temp_update_treatment tut
    WHERE treatment.id = tut.id`
    await tx.any(query1)
    return tx.any(query2)
  }

  @setErrorCode('5I6000')
  getDistinctExperimentIds = (ids) => this.rep.any('SELECT DISTINCT(experiment_id) FROM treatment WHERE id IN ($1:csv)', [ids])

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
  findByBusinessKey = (keys) => this.rep.oneOrNone('SELECT * FROM treatment WHERE experiment_id=$1 and treatment_number=$2', keys)

  @setErrorCode('5IA000')
  batchFindAllTreatmentLevelDetails = (treatmentIds) => this.rep.any('SELECT ce.treatment_id, fl.value, f.name FROM factor_level fl INNER JOIN combination_element ce ON fl.id = ce.factor_level_id INNER JOIN factor f ON fl.factor_id = f.id WHERE ce.treatment_id IN ($1:csv)', [treatmentIds])

  @setErrorCode('5IB000')
  batchFindByBusinessKey = (batchKeys) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      treatment_number: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, treatment_number, id) AS (VALUES ${this.pgp.helpers.values(values, ['experiment_id', 'treatment_number', 'id'])}) select t.experiment_id, t.treatment_number from public.treatment t inner join d on t.experiment_id = CAST(d.experiment_id as integer) and t.treatment_number = d.treatment_number and (d.id is null or t.id != CAST(d.id as integer))`
    return this.rep.any(query)
  }

  @setErrorCode('5IC000')
  batchFindAllByExperimentId = (experimentIds) => {
    return this.rep.any('SELECT * FROM treatment WHERE experiment_id IN ($1:csv)', [experimentIds])
      .then(data => {
        const dataByExperimentId = _.groupBy(data, 'experiment_id')
        return _.map(experimentIds, experimentId => dataByExperimentId[experimentId] || [])
      })
  }

  batchFindAllBySetId = (setIds) => {
    return this.rep.any(`WITH experiment_ids AS (
  SELECT experiment_id
  FROM block b
    INNER JOIN location_association la ON b.id = la.block_id
  WHERE la.set_id in ($1:csv)	
), treatment_block_info AS (
  SELECT tb.treatment_id, json_build_object('name', b.name, 'blockId', b.id, 'numPerRep', tb.num_per_rep) AS block_info
  FROM block b
    INNER JOIN treatment_block tb ON b.id = tb.block_id
  WHERE b.experiment_id IN (SELECT * FROM experiment_ids)
), grouped_treatment_block_info AS (
  SELECT treatment_id, json_agg(block_info) AS blocks
  FROM treatment_block_info
  GROUP BY treatment_id
)
SELECT t.*, la.set_id,
  json_array_length(gtbi.blocks) > 1 AS in_all_blocks,
  CASE WHEN json_array_length(gtbi.blocks) = 1 THEN gtbi.blocks -> 0 -> 'name' ELSE NULL END AS block,
  CASE WHEN json_array_length(gtbi.blocks) = 1 THEN gtbi.blocks -> 0 -> 'blockId' ELSE NULL END AS block_id,
  gtbi.blocks
FROM treatment t
  INNER JOIN treatment_block tb ON t.id = tb.treatment_id
  INNER JOIN block b ON tb.block_id = b.id
  INNER JOIN location_association la ON b.id = la.block_id
  INNER JOIN grouped_treatment_block_info gtbi ON t.id = gtbi.treatment_id
WHERE la.set_id in ($1:csv)`, [setIds])
      .then(data => {
        const dataBySetId = _.groupBy(data, 'set_id')
        return _.compact(_.flatMap(setIds, setId =>
          _.map(dataBySetId[setId] || [], treatment => _.omit(treatment, ['set_id']))))
      })
  }
}

module.exports = (rep, pgp) => new treatmentRepo(rep, pgp)
