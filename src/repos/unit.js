module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM unit WHERE id = $1", id)
        },

        findAllByTreatmentId: (treatmentId, tx = rep) => {
            return tx.any("SELECT * FROM unit WHERE treatment_id = $1", treatmentId)
        },

        findAllByExperimentId: (experimentId, tx = rep) => {
            return tx.any("SELECT u.* FROM unit u, treatment t WHERE u.treatment_id=t.id and t.experiment_id=$1", experimentId)
        },

        batchFindAllByTreatmentIds: (treatmentIds, tx = rep) => {
            return tx.any("SELECT * FROM unit WHERE treatment_id IN ($1:csv)", [treatmentIds])
        },
        batchFindAllByGroupIds: (groupIds, tx = rep) => {
            return tx.any("SELECT * FROM unit WHERE group_id IN ($1:csv)", [groupIds])
        },
        batchCreate: (units, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['group_id', 'treatment_id','rep', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
                {table: 'unit'}
            )

            const values = units.map((u)=>{
                return {
                    group_id: u.groupId,
                    treatment_id: u.treatmentId,
                    rep: u.rep,
                    created_user_id: context.userId,
                    created_date: 'CURRENT_TIMESTAMP',
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })

            const query = pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' RETURNING id'

            return tx.any(query)
        },

        batchUpdate: (units, context, tx = rep) => {
            return tx.batch(
                units.map(
                    u => tx.oneOrNone(
                        "UPDATE unit SET (group_id, treatment_id, rep, modified_user_id, modified_date) = " +
                        "($1, $2, $3, $4, CURRENT_TIMESTAMP) WHERE id = $5 RETURNING *",
                        [u.groupId, u.treatmentId, u.rep, context.userId, u.id]
                    )
                )
            )
        },

        remove: (id, tx = rep) => {
            return tx.oneOrNone("DELETE FROM unit WHERE id = $1 RETURNING id", id)
        },

        batchRemove: (ids, tx = rep) => {
            return tx.batch(
                ids.map(
                    id => tx.oneOrNone("DELETE FROM unit WHERE id = $1 RETURNING id", id)
                )
            )
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM unit WHERE id IN ($1:csv)", [ids])
        }
    }
}