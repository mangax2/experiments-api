import _ from 'lodash'

module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM combination_element WHERE id = $1", id)
        },

        findAllByTreatmentId: (treatmentId, tx = rep) => {
            return tx.any("SELECT * FROM combination_element WHERE treatment_id = $1", treatmentId)
        },

        batchFindAllByTreatmentIds: (treatmentIds, tx = rep) => {
            if (treatmentIds == null || treatmentIds == undefined || treatmentIds.length == 0) {
                return Promise.resolve([])
            } else {
                return tx.any("SELECT * FROM combination_element WHERE treatment_id IN ($1:csv)", [treatmentIds]).then((data) => {
                    const groups = _.groupBy(data, (d) => d.treatment_id)
                    return _.map(treatmentIds, (treatmentId) => groups[treatmentId])
                })
            }
        },

        batchCreate: (combinationElements, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['name', 'value', 'treatment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
                {table: 'combination_element'}
            )
            const values = combinationElements.map((ce) => {
                return{
                    name: ce.name,
                    value: ce.value,
                    treatment_id: ce.treatmentId,
                    created_user_id: context.userId,
                    created_date: 'CURRENT_TIMESTAMP',
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })
            const query = pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' RETURNING id'

            return tx.any(query)
        },

        batchUpdate: (combinationElements, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['?id', 'name', 'value', 'treatment_id', 'modified_user_id', 'modified_date'],
                {table: 'combination_element'}
            )
            const data = combinationElements.map((ce) => {
                return {
                    id: ce.id,
                    name: ce.name,
                    value: ce.value,
                    treatment_id: ce.treatmentId,
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })
            const query = pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' WHERE v.id = t.id RETURNING *'

            return tx.any(query)
        },

        remove: (id, tx= rep) => {
            return tx.oneOrNone("DELETE FROM combination_element WHERE id = $1 RETURNING id", id)
        },

        batchRemove: (ids, tx = rep) => {
            if (ids == null || ids == undefined || ids.length == 0) {
                return Promise.resolve([])
            } else {
                return tx.any("DELETE FROM combination_element WHERE id IN ($1:csv) RETURNING id", [ids])
            }
        },

        findByBusinessKey: (keys, tx= rep) => {
            return tx.oneOrNone("SELECT * FROM combination_element WHERE treatment_id = $1 and name = $2", keys)
        }
    }
}