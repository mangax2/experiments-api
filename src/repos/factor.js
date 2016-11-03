module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM factor WHERE id = $1", id)
        },

        findByExperimentId: (experimentId, tx = rep) => {
            return tx.any("SELECT * FROM factor WHERE experiment_id=$1", experimentId)
        },

        all: (tx = rep) => {
            return tx.any("SELECT * FROM factor")
        },

        batchCreate: (factors, context, tx = rep) => {
            return tx.batch(
                factors.map(
                    factor => tx.one(
                        "INSERT INTO factor(name, ref_factor_type_id, experiment_id, created_user_id, created_date, modified_user_id, modified_date) " +
                        "VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP) RETURNING id",
                        [factor.name, factor.refFactorTypeId, factor.experimentId, context.userId]
                    )
                )
            )
        },

        batchUpdate: (factors, context, tx = rep) => {
            return tx.batch(
                factors.map(
                    factor => tx.oneOrNone(
                        "UPDATE factor SET (name, ref_factor_type_id, experiment_id, modified_user_id, modified_date) = " +
                        "($1, $2, $3, $4, CURRENT_TIMESTAMP) WHERE id=$5 RETURNING *",
                        [factor.name, factor.refFactorTypeId, factor.experimentId, context.userId, factor.id]
                    )
                )
            )
        },

        remove: (id, tx = rep) => {
            return tx.oneOrNone("DELETE FROM factor WHERE id=$1 RETURNING id", id)
        },

        removeByExperimentId: (experimentId, tx = rep) => {
            return tx.any("DELETE FROM factor WHERE experiment_id = $1 RETURNING id", experimentId)
        },

        findByBusinessKey: (keys, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM factor WHERE experiment_id=$1 and name=$2", keys)
        }
    }
}