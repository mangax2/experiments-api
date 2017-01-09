module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM ref_randomization_strategy WHERE id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM ref_randomization_strategy")
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM ref_randomization_strategy WHERE id IN ($1:csv)", [ids])
        }
    }
}