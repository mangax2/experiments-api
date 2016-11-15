module.exports = (rep) => {
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

        batchCreate: (combinationElements, context, tx = rep) => {
            return tx.batch(
                combinationElements.map(
                    combinationElement => tx.one(
                        "INSERT INTO combination_element(name, value, treatment_id, created_user_id, created_date, modified_user_id, modified_date) " +
                        "VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP) RETURNING id",
                        [combinationElement.name, combinationElement.value, combinationElement.treatmentId, context.userId]
                    )
                )
            )
        },

        batchUpdate: (combinationElements, context, tx = rep) => {
            return tx.batch(
                combinationElements.map(
                    combinationElement => tx.oneOrNone(
                        "UPDATE combination_element SET (name, value, treatment_id, modified_user_id, modified_date) = " +
                        "($1, $2, $3, $4, CURRENT_TIMESTAMP) WHERE id = $5 RETURNING *",
                        [combinationElement.name, combinationElement.value, combinationElement.treatmentId, context.userId, combinationElement.id]
                    )
                )
            )
        },

        remove: (id, tx= rep) => {
            return tx.oneOrNone("DELETE FROM combination_element WHERE id = $1 RETURNING id", id)
        },

        findByBusinessKey: (keys, tx= rep) => {
            return tx.oneOrNone("SELECT * FROM combination_element WHERE treatment_id = $1 and name = $2", keys)
        }
    }
}