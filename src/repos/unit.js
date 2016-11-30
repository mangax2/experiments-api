module.exports = (rep) => {
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
            return tx.batch(
                treatmentIds.map(
                    id => tx.any("SELECT * FROM unit WHERE treatment_id = $1", id)
                )
            )
        },

        batchCreate: (units, context, tx = rep) => {
            return tx.batch(
                units.map(
                    u => tx.one(
                        "INSERT INTO unit(group_id, treatment_id, rep, created_user_id, created_date, modified_user_id, modified_date) " +
                        "VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP) RETURNING id",
                        [u.groupId, u.treatmentId, u.rep, context.userId]
                    )
                )
            )
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

        findByBusinessKey: (keys, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM unit WHERE treatment_id = $1 and rep = $2", keys)
        }
    }
}