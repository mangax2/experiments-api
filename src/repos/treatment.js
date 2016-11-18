module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM treatment WHERE id = $1", id)
        },

        findAllByExperimentId: (experimentId, tx = rep) => {
            return tx.any("SELECT * FROM treatment WHERE experiment_id=$1", experimentId)
        },

        batchCreate: (treatments, context, tx = rep) => {
            return tx.batch(
                treatments.map(
                    treatment => tx.one(
                        "INSERT INTO treatment(is_control, name, notes ,experiment_id, created_user_id, created_date, modified_user_id, modified_date) " +
                        "VALUES($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP) RETURNING id",
                        [treatment.isControl, treatment.name, treatment.notes, treatment.experimentId, context.userId]
                    )
                )
            )
        },

        batchUpdate: (treatments, context, tx = rep) => {
            return tx.batch(
                treatments.map(
                    treatment => tx.oneOrNone(
                        "UPDATE treatment SET (is_control, name, notes, experiment_id, modified_user_id, modified_date) = " +
                        "($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) WHERE id=$6 RETURNING *",
                        [treatment.isControl, treatment.name,treatment.notes, treatment.experimentId, context.userId, treatment.id]
                    )
                )
            )
        },

        remove: (id, tx = rep) => {
            return tx.oneOrNone("DELETE FROM treatment WHERE id=$1 RETURNING id", id)
        },

        batchRemove: (ids, tx = rep) => {
            return tx.batch(
                ids.map(
                    id => tx.oneOrNone("DELETE FROM treatment WHERE id=$1 RETURNING id", id)
                )
            )
        },

        removeByExperimentId: (experimentId, tx = rep) => {
            return tx.any("DELETE FROM treatment WHERE experiment_id = $1 RETURNING id", experimentId)
        },

        findByBusinessKey: (keys, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM treatment WHERE experiment_id=$1 and name=$2", keys)
        }
    }
}