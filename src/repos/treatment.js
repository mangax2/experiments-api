module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM treatment WHERE id = $1", id)
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM treatment WHERE id IN ($1:csv)", [ids])
        },

        findAllByExperimentId: (experimentId, tx = rep) => {
            return tx.any("SELECT * FROM treatment WHERE experiment_id=$1 ORDER BY treatment_number ASC", experimentId)
        },

        batchCreate: (treatments, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['is_control', 'treatment_number', 'notes', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
                {table: 'treatment'}
            )
            const values = treatments.map((t) => {
                return{
                    is_control: t.isControl,
                    treatment_number: t.treatmentNumber,
                    notes: t.notes,
                    experiment_id: t.experimentId,
                    created_user_id: context.userId,
                    created_date: 'CURRENT_TIMESTAMP',
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })
            const query = pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' RETURNING id'

            return tx.any(query)
        },

        batchUpdate: (treatments, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['?id', 'is_control', 'treatment_number', 'notes', 'experiment_id', 'modified_user_id', 'modified_date'],
                {table: 'treatment'}
            )
            const data = treatments.map((t) => {
                return {
                    id: t.id,
                    is_control: t.isControl,
                    treatment_number: t.treatmentNumber,
                    notes: t.notes,
                    experiment_id: t.experimentId,
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })
            const query = pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' WHERE v.id = t.id RETURNING *'

            return tx.any(query)
        },

        remove: (id, tx = rep) => {
            return tx.oneOrNone("DELETE FROM treatment WHERE id=$1 RETURNING id", id)
        },

        batchRemove: (ids, tx = rep) => {
            if (ids == null || ids == undefined || ids.length == 0) {
                return Promise.resolve([])
            } else {
                return tx.any("DELETE FROM treatment WHERE id IN ($1:csv) RETURNING id", [ids])
            }
        },

        removeByExperimentId: (experimentId, tx = rep) => {
            return tx.any("DELETE FROM treatment WHERE experiment_id = $1 RETURNING id", experimentId)
        },

        findByBusinessKey: (keys, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM treatment WHERE experiment_id=$1 and treatment_number=$2", keys)
        },

        batchFindByBusinessKey: (batchKeys, tx= rep) => {
            const values = batchKeys.map((obj) => {
                return {
                    experiment_id: obj.keys[0],
                    treatment_number: obj.keys[1],
                    id: obj.updateId
                }
            })
            const query = 'WITH d(experiment_id, treatment_number, id) AS (VALUES ' + pgp.helpers.values(values, ['experiment_id', 'treatment_number', 'id']) + ') select t.experiment_id, t.treatment_number from public.treatment t inner join d on t.experiment_id = CAST(d.experiment_id as integer) and t.treatment_number = d.treatment_number and (d.id is null or t.id != CAST(d.id as integer))'
            return tx.any(query)
        }
    }
}