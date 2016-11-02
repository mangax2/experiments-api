module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM factor WHERE id = $1", id)
        },

        findTx: (tx, id) => {
            return tx.oneOrNone("SELECT * FROM factor WHERE id = $1", id)
        },

        findByExperimentId: (experimentId) => {
            return rep.any("SELECT * FROM factor WHERE experiment_id=$1", experimentId)
        },

        all: () => {
            return rep.any("SELECT * FROM factor")
        },

        batchCreate: (t, factors) => {
            return t.batch(
                factors.map(
                    factor => t.one(
                        "INSERT INTO factor(name, ref_factor_type_id, experiment_id, created_user_id, created_date, modified_user_id, modified_date) " +
                        "VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP) RETURNING id",
                        [factor.name, factor.refFactorTypeId, factor.experimentId, factor.userId]
                    )
                )
            )
        },

        batchUpdate: (t, factors) => {
            return t.batch(
                factors.map(
                    factor => t.oneOrNone(
                        "UPDATE factor SET (name, ref_factor_type_id, experiment_id, modified_user_id, modified_date) = " +
                        "($1, $2, $3, $4, CURRENT_TIMESTAMP) WHERE id=$5 RETURNING *",
                        [factor.name, factor.refFactorTypeId, factor.experimentId, factor.userId, factor.id]
                    )
                )
            )
        },

        remove: (id) => {
            return rep.oneOrNone("DELETE FROM factor WHERE id=$1 RETURNING id", id)
        },

        removeByExperimentId: (t, experimentId) => {
            return t.any("DELETE FROM factor WHERE experiment_id = $1 RETURNING id", experimentId)
        },

        findByBusinessKey: (keys) => {
            return rep.oneOrNone("SELECT * FROM factor WHERE experiment_id=$1 and name=$2", keys)
        },

        findByBusinessKeyTx: (tx, keys) => {
            return tx.oneOrNone("SELECT * FROM factor WHERE experiment_id=$1 and name=$2", keys)
        }
    }
}