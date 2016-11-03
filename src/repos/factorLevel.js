module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM factor_level WHERE id = $1", id)
        },

        findByFactorId: (factorId) => {
            return rep.any("SELECT * FROM factor_level WHERE factor_id = $1", factorId)
        },

        all: () => {
            return rep.any("SELECT * FROM factor_level")
        },

        batchCreate: (t, factorLevels, context) => {
            return t.batch(
                factorLevels.map(
                    factorLevel => t.one(
                        "INSERT INTO factor_level(value, factor_id, created_user_id, created_date, modified_user_id, modified_date) " +
                        "VALUES($1, $2, $3, CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP) RETURNING id",
                        [factorLevel.value, factorLevel.factorId, context.userId]
                    )
                )
            )
        },

        batchUpdate: (t, factorLevels, context) => {
            return t.batch(
                factorLevels.map(
                    factorLevel => t.oneOrNone(
                        "UPDATE factor_level SET (value, factor_id, modified_user_id, modified_date) = " +
                        "($1, $2, $3, CURRENT_TIMESTAMP) WHERE id = $4 RETURNING *",
                        [factorLevel.value, factorLevel.factorId, context.userId, factorLevel.id]
                    )
                )
            )
        },

        remove: (id) => {
            return rep.oneOrNone("DELETE FROM factor_level WHERE id = $1 RETURNING id", id)
        },

        findByBusinessKey: (keys, tx) => {
            return tx.oneOrNone("SELECT * FROM factor_level WHERE factor_id = $1 and value = $2", keys)
        }
    }
}