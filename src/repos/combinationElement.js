import _ from 'lodash'

const columns = "ce.id, f.name, COALESCE(fl.value->>'refId', fl.value->>'text') AS value, ce.created_user_id, ce.created_date, ce.modified_user_id, ce.modified_date"
const tables = 'combination_element_new ce INNER JOIN factor_level_new fl ON ce.factor_level_id = fl.id INNER JOIN factor_new f ON fl.factor_id = f.id'
const genericSqlStatement = `SELECT ${columns} FROM ${tables}`

module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone(`${genericSqlStatement} WHERE ce.id = $1`, id),

  batchFind: (ids, tx = rep) => tx.any(`${genericSqlStatement} WHERE ce.id IN ($1:csv)`, [ids]),

  findAllByTreatmentId: (treatmentId, tx = rep) => tx.any(`${genericSqlStatement} WHERE ce.treatment_id = $1`, treatmentId),

  batchFindAllByTreatmentIds: (treatmentIds, tx = rep) => {
    if (!treatmentIds || treatmentIds.length === 0) {
      return Promise.resolve([])
    }
    return tx.any(`${genericSqlStatement} WHERE ce.treatment_id IN ($1:csv)`, [treatmentIds]).then((data) => {
      const elements = _.groupBy(data, d => d.treatment_id)
      return _.map(treatmentIds, treatmentId => elements[treatmentId])
    })
  },

  batchCreate: (combinationElements, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['name', 'value', 'treatment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'combination_element' },
    )
    const values = combinationElements.map(ce => ({
      name: ce.name,
      value: ce.value,
      treatment_id: ce.treatmentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  },

  batchUpdate: (combinationElements, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['?id', 'name', 'value', 'treatment_id', 'modified_user_id', 'modified_date'],
      { table: 'combination_element' },
    )
    const data = combinationElements.map(ce => ({
      id: ce.id,
      name: ce.name,
      value: ce.value,
      treatment_id: ce.treatmentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  },

  remove: (id, tx = rep) => tx.oneOrNone('DELETE FROM combination_element WHERE id = $1 RETURNING id', id),

  batchRemove: (ids, tx = rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM combination_element WHERE id IN ($1:csv) RETURNING id', [ids])
  },

  findByBusinessKey: (keys, tx = rep) => tx.oneOrNone(`${genericSqlStatement} WHERE ce.treatment_id = $1 and f.name = $2`, keys),

  batchFindByBusinessKey: (batchKeys, tx = rep) => {
    const values = batchKeys.map(obj => ({
      treatment_id: obj.keys[0],
      name: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(treatment_id, name, id) AS (VALUES ${pgp.helpers.values(values, ['treatment_id', 'name', 'id'])}) SELECT ce.treatment_id, f.name FROM ${tables} INNER JOIN d ON ce.treatment_id = CAST(d.treatment_id AS integer) AND ce.name = d.name AND (d.id IS NULL OR ce.id != CAST(d.id AS integer))`
    return tx.any(query)
  },
})
